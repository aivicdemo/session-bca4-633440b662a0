import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  InvalidEmailAddressFormat,
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

describe('SCEN-332: メールアドレスが標準的なメールアドレス形式に違反している場合、InvalidEmailAddressFormatエラーを返す', () => {
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
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });
    // @ts-ignore
    mockValidateEmailAddress.mockImplementation((input: any) => {
      if (input.emailAddress === 'invalid-email-format') {
        throw new InvalidEmailAddressFormat(
          'メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。'
        );
      }
      // @ts-ignore
      return Promise.resolve({ isValid: true });
    });
  });

  it('メールアドレスが標準的なメールアドレス形式に違反している場合、InvalidEmailAddressFormatエラーを返す', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '有効な報告者名',
      emailAddress: 'invalid-email-format',
      teamLeaderId: 'valid-team-leader-id',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(result.message).toBe(
      'メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。'
    );

    // registerReporterToMasterおよびpersistReporterMasterChangeHistoryは呼び出されない
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
