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

describe('SCEN-334: 指定されたユーザーIDがユーザーマスタに存在しない場合、UserNotFoundInUserMasterエラーを返す', () => {
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

    // スタブ設定：指定されたuserIdがユーザーマスタに存在しないシナリオ
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockImplementation((input: any) => {
      if (input.userId === 'NONEXISTENT_USER_001') {
        throw new UserNotFoundInUserMaster(
          '指定されたユーザーはシステムに登録されていません。ユーザーマスタを確認してください。'
        );
      }
      // @ts-ignore
      return Promise.resolve({ isActive: true });
    });
  });

  it('指定されたユーザーIDがユーザーマスタに存在しない場合、UserNotFoundInUserMasterエラーを返す', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'NONEXISTENT_USER_001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka.taro@example.com',
      teamLeaderId: 'LEADER_001',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      '指定されたユーザーはシステムに登録されていません。ユーザーマスタを確認してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMasterおよびpersistReporterMasterChangeHistoryは呼び出されない
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
