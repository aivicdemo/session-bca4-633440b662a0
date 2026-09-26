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

describe('SCEN-368: 報告者IDが空または不正な形式の場合、br-tx_7-007の制約1により「報告者IDが指定されていません」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('報告者IDが空文字列の場合、エラーメッセージが返される', async () => {
    const input = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:30:00Z'),
    };

    // スタブの設定
    mockedValidateReporterNameFormat.mockResolvedValue({ valid: true });
    mockedValidateEmailAddress.mockResolvedValue({ valid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    mockedValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    // registerReporterToMasterが空文字列を返すように設定
    mockedRegisterReporterToMaster.mockResolvedValue({ reporterId: '' });

    // persistReporterMasterChangeHistoryが報告者IDが空のときエラーを発生させる
    mockedPersistReporterMasterChangeHistory.mockImplementation((input: any) => {
      if (!input.reporterId || input.reporterId === '') {
        throw new Error('報告者IDが指定されていません');
      }
      return Promise.resolve({ changeHistoryId: 'CHG001' });
    });

    // registerReporter関数を呼び出す
    const result = await registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(result.message).toBe('報告者IDが指定されていません');
  });
});
