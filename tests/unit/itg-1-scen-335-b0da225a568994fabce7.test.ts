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

import { registerReporter, UserNotFoundInUserMaster } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-335: UserNotFoundInUserMasterエラーが返される', () => {
  const now = new Date('2024-01-15T10:00:00Z');
  const input = {
    userId: 'USER-999',
    reporterName: '山田太郎',
    emailAddress: 'yamada@example.com',
    teamLeaderId: 'LEADER-001',
    executionTimestamp: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたユーザーIDのステータスが無効な場合、UserNotFoundInUserMasterエラーを返す', async () => {
    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: false,
      userId: 'USER-999',
      inactiveReason: 'ユーザーがユーザーマスタに存在しないか、ステータスが無効である',
    });

    let errorThrown: any = null;
    try {
      await registerReporter(input);
    } catch (error: any) {
      errorThrown = error;
    }

    expect(errorThrown).toBeInstanceOf(UserNotFoundInUserMaster);
    expect(errorThrown?.message).toBe('指定されたユーザーはシステムに登録されていません。ユーザーマスタを確認してください。');

    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
