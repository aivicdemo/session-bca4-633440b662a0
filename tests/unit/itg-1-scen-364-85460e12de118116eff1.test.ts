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

describe('SCEN-364: 同じメールアドレスで複数の報告者が登録されている場合、DuplicateEmailAddressDetectedエラーが返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('重複するメールアドレスが検出された場合、エラーメッセージが返される', async () => {
    // 入力値を設定
    const input = {
      userId: 'U001',
      reporterName: '新規報告者',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    // スタブの設定
    mockedValidateEmailAddress.mockResolvedValue({ valid: true });
    mockedValidateReporterNameFormat.mockResolvedValue({ valid: true });
    mockedValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    // 重複検出を「重複あり」として設定
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: true,
      existingReporterId: 'R001',
      existingReporterName: '既存報告者'
    });

    // registerReporter関数を呼び出す
    const result = await registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。');

    // registerReporterToMasterとpersistReporterMasterChangeHistoryが呼ばれていないことを確認
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
