import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidReporterNameFormat,
  InvalidEmailAddressFormat,
  DuplicateEmailAddressDetected,
  UserNotFoundInUserMaster,
  RegistrationFailed,
} from '../../src/logic/reporter-master-management';

// 依存先のモック
jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  validateUserAccountActiveStatus: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-347: 報告者名が入力され、メールアドレスが入力され、メールアドレス形式が正しく、重複がない場合、br-tx_7-003により有効判定で返される', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 各モックを取得
    mockValidateReporterNameFormat = require('../../src/logic/input-validation-formatting.ts').validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = require('../../src/logic/input-validation-formatting.ts').validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts').detectDuplicateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = require('../../src/logic/user-authentication-authorization.ts').validateUserAccountActiveStatus as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts').registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // 検証成功
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    // registerReporterToMaster が成功を返す
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterId: 'REPORTER001',
    });

    // persistReporterMasterChangeHistory が成功を返す
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'HISTORY001',
    });
  });

  it('正常系：報告者名が入力、メールアドレスが入力、形式正常、重複なしで登録成功', async () => {
    // 入力値を構築
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER001');
    expect(result.message).toContain('報告者を正常に登録しました');
    expect(result.changeHistoryId).toBe('HISTORY001');

    // 各検証関数が呼び出されたことを確認
    expect(mockValidateReporterNameFormat).toHaveBeenCalledWith('山田太郎');
    expect(mockValidateEmailAddress).toHaveBeenCalledWith('yamada@example.com');
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalledWith('yamada@example.com');
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledWith('USER001');

    // registerReporterToMaster と persistReporterMasterChangeHistory が呼び出されたことを確認
    expect(mockRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
