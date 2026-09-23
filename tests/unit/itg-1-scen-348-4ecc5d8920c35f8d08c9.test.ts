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

describe('SCEN-348: 報告者名が空の場合、br-tx_7-003の制約1により「氏名は必須です」エラーメッセージが返される', () => {
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

    // validateReporterNameFormat が空文字列のときエラーをスロー
    // @ts-ignore
    mockValidateReporterNameFormat.mockImplementation((name: string) => {
      if (name === '' || name.trim() === '') {
        throw new InvalidReporterNameFormat(
          '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
        );
      }
      return { isValid: true };
    });
  });

  it('報告者名が空の場合、エラーメッセージが返される', async () => {
    // 入力値を構築（報告者名が空文字列）
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '',
      emailAddress: 'reporter@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toContain('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。');
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster と persistReporterMasterChangeHistory が呼び出されていないことを確認
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
