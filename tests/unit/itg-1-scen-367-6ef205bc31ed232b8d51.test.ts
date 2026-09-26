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

describe('SCEN-367: DELETE操作が指定された場合、br-tx_7-007により操作種別・報告者ID・実行者・実行日時が監査ログに記録される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('DELETE操作時に監査ログが正しく記録される', async () => {
    const executionTimestamp = new Date('2024-01-15T10:30:00Z');
    const input = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    // スタブの設定
    mockedValidateReporterNameFormat.mockResolvedValue({ valid: true });
    mockedValidateEmailAddress.mockResolvedValue({ valid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ valid: true });
    mockedValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });
    mockedRegisterReporterToMaster.mockResolvedValue({ reporterId: 'RPT20240115001' });
    mockedPersistReporterMasterChangeHistory.mockResolvedValue({ changeHistoryId: 'CHG20240115001' });

    // registerReporter関数を呼び出す
    const result = await registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT20240115001');
    expect(result.changeHistoryId).toBe('CHG20240115001');
    expect(result.message).toBe('報告者の登録に成功しました');

    // persistReporterMasterChangeHistoryが呼ばれたことを確認
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalledTimes(1);

    const callArgs = mockedPersistReporterMasterChangeHistory.mock.calls[0][0];
    expect(callArgs.operationType).toBe('DELETE');
    expect(callArgs.reporterId).toBe('RPT20240115001');
    expect(callArgs.executedBy).toBe('TL001');
    expect(callArgs.executedAt).toEqual(executionTimestamp);
    expect(callArgs.changedFields).toEqual([]);
  });
});
