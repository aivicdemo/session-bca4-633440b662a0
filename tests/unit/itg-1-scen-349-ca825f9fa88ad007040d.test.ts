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

describe('SCEN-349: メールアドレスが空の場合、br-tx_7-003の制約2により「メールアドレスは必須です」エラーメッセージが返される', () => {
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

    // validateReporterNameFormat は成功
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });

    // validateEmailAddress が空文字列のときエラーをスロー
    // @ts-ignore
    mockValidateEmailAddress.mockImplementation((email: string) => {
      if (email === '' || email.trim() === '') {
        throw new InvalidEmailAddressFormat(
          'メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。'
        );
      }
      return { isValid: true };
    });
  });

  it('メールアドレスが空の場合、エラーメッセージが返される', async () => {
    // 入力値を構築（メールアドレスが空文字列）
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: '',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toContain('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster と persistReporterMasterChangeHistory が呼び出されていないことを確認
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
