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

describe('SCEN-345: 既に登録されているメンバーIDが重複して登録されようとする場合、br-tx_7-002の制約2により「このメンバーは既に登録されています」エラーで処理が中断される', () => {
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

    // 成功応答に設定（重複チェック前まで）
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    // registerReporterToMaster が重複メンバーIDエラーを返す
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({
      success: false,
      reporterId: null,
      message: 'このメンバーは既に登録されています',
    });
  });

  it('既に登録されているメンバーIDが重複する場合、エラーが返される', async () => {
    // 入力値を構築（既に登録されているメンバーID user-001）
    const input: RegisterReporterInput = {
      userId: 'user-001',
      reporterName: 'テスト太郎',
      emailAddress: 'member1.new@company.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメンバーは既に登録されています');
    expect(result.changeHistoryId).toBeNull();

    // persistReporterMasterChangeHistory が呼び出されていないことを確認
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
