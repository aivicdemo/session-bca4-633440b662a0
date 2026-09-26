import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));
jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

import { registerReporter } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-366: UPDATE操作で変更前後の値が異なる場合、br-tx_7-007により変更された項目だけが監査ログに記録される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('UPDATE操作時に変更項目のみが監査ログに記録される', async () => {
    const executionTimestamp = new Date('2024-01-15T10:30:00Z');
    const executionTimestamp2 = new Date('2024-01-15T10:31:00Z');

    // スタブの設定
    mockedValidateReporterNameFormat.mockResolvedValue({ valid: true });
    mockedValidateEmailAddress.mockResolvedValue({ valid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    mockedValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    let callCount = 0;
    mockedRegisterReporterToMaster.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ reporterId: 'RPT-2024-001' });
      }
      return Promise.resolve({ reporterId: 'RPT-2024-001' }); // 同じIDで更新
    });

    let historyCallCount = 0;
    mockedPersistReporterMasterChangeHistory.mockImplementation((input: any) => {
      historyCallCount++;
      if (historyCallCount === 1) {
        return Promise.resolve({ changeHistoryId: 'CHG-2024-0001' });
      }
      // UPDATE操作の2回目
      return Promise.resolve({ changeHistoryId: 'CHG-2024-0002' });
    });

    // 1回目: 新規登録
    const input1 = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'newuser@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp,
    };
    const result1 = await registerReporter(input1);
    expect(result1.success).toBe(true);
    expect(result1.reporterId).toBe('RPT-2024-001');

    // 2回目: UPDATE操作（報告者名のみ変更）
    const input2 = {
      userId: 'U001',
      reporterName: '山田太郎更新',
      emailAddress: 'newuser@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp: executionTimestamp2,
    };
    const result2 = await registerReporter(input2);
    expect(result2.success).toBe(true);

    // 2回目のpersistReporterMasterChangeHistoryの呼び出しを確認
    const updateCallArgs = mockedPersistReporterMasterChangeHistory.mock.calls[1][0];
    expect(updateCallArgs.operationType).toBe('UPDATE');
    expect(updateCallArgs.reporterId).toBe('RPT-2024-001');

    // beforeValuesとafterValuesを検証
    expect(updateCallArgs.beforeValues?.reporterName).toBe('山田太郎');
    expect(updateCallArgs.afterValues?.reporterName).toBe('山田太郎更新');

    // メールアドレスは変わっていないため比較対象外
    expect(updateCallArgs.beforeValues?.emailAddress).toBe('newuser@example.com');
    expect(updateCallArgs.afterValues?.emailAddress).toBe('newuser@example.com');
  });
});
