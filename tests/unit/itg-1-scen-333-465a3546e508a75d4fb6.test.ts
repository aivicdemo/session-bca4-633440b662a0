import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  DuplicateEmailAddressDetected,
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

describe('SCEN-333: 入力されたメールアドレスが既にマスタに登録されている場合、DuplicateEmailAddressDetectedエラーを返す', () => {
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

    // スタブ設定
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockImplementation((input: any) => {
      if (input.emailAddress === 'yamada@example.com') {
        throw new DuplicateEmailAddressDetected(
          'このメールアドレスは既に登録されています。別のメールアドレスを入力してください。'
        );
      }
      // @ts-ignore
      return Promise.resolve({ isDuplicate: false });
    });

    // registerReporterToMasterとpersistReporterMasterChangeHistoryが呼び出された場合は例外を発生させる
    mockRegisterReporterToMaster.mockImplementation(() => {
      throw new Error('registerReporterToMaster should not be called');
    });
    mockPersistReporterMasterChangeHistory.mockImplementation(() => {
      throw new Error('persistReporterMasterChangeHistory should not be called');
    });
  });

  it('入力されたメールアドレスが既にマスタに登録されている場合、DuplicateEmailAddressDetectedエラーを返す', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      'このメールアドレスは既に登録されています。別のメールアドレスを入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMasterおよびpersistReporterMasterChangeHistoryは呼び出されない
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
