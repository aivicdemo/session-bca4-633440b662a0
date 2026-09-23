import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  UserNotFoundInUserMaster,
} from '../../src/logic/reporter-master-management';
import type {
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

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

describe('SCEN-338: ユーザーマスタに登録されたユーザーが全員非アクティブの場合、br-tx_3-004の制約2により「アクティブなユーザーがいません。ユーザーマスタを確認してください」警告が記録される', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateReporterNameFormat = require('../../src/logic/input-validation-formatting.ts')
      .validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .detectDuplicateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = require('../../src/logic/user-authentication-authorization.ts')
      .validateUserAccountActiveStatus as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts')
      .registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts')
      .persistReporterMasterChangeHistory as jest.Mock;

    // スタブ設定：各検証処理は成功を返す
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });

    // ユーザーマスタの全員が非アクティブ状態：警告を発生させるが、処理は続行
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockImplementation(() => {
      throw new UserNotFoundInUserMaster(
        'アクティブなユーザーがいません。ユーザーマスタを確認してください'
      );
    });
  });

  it('ユーザーマスタに登録されたユーザーが全員非アクティブの場合、br-tx_3-004の制約2により警告が記録される', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'user-001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      'アクティブなユーザーがいません。ユーザーマスタを確認してください'
    );
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster関数は呼び出されず、報告者はマスタに登録されない
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();

    // persistReporterMasterChangeHistory関数も呼び出されない
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
