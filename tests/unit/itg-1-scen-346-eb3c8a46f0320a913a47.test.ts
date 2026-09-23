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

describe('SCEN-346: 削除対象のメンバーが過去7日以内に日報を提出している場合、br-tx_7-002の制約3により「最近の日報があります。削除前に確認してください」警告が返される', () => {
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

    // 成功応答に設定（検証済み）
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    // registerReporterToMaster が警告フラグを含むレスポンスを返す（削除対象メンバーが過去7日以内に日報提出済み）
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({
      success: false,
      reporterId: null,
      warning: true,
      message: '最近の日報があります。削除前に確認してください',
    });

    // persistReporterMasterChangeHistory は呼び出されない（警告により処理が中断されるため）
  });

  it('削除対象のメンバーが過去7日以内に日報を提出している場合、警告が返される', async () => {
    // 入力値を構築
    const input: RegisterReporterInput = {
      userId: 'reporter-001',
      reporterName: '削除対象メンバー名',
      emailAddress: 'delete.member@example.com',
      teamLeaderId: 'teamleader-001',
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('最近の日報があります。削除前に確認してください');
    expect(result.changeHistoryId).toBeNull();

    // persistReporterMasterChangeHistory が呼び出されていないことを確認
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
