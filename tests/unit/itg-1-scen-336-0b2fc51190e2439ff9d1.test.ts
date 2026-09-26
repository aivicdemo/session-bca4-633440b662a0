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

import { registerReporter, RegistrationFailed } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-336: データベースへの保存処理に失敗した場合、RegistrationFailedエラーを返す', () => {
  const now = new Date('2024-01-15T10:00:00Z');
  const input = {
    userId: 'U001',
    reporterName: '山田太郎',
    emailAddress: 'yamada@example.com',
    teamLeaderId: 'TL001',
    executionTimestamp: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registerReporterToMasterが失敗状態で設定される場合、RegistrationFailedエラーを返す', async () => {
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
      isActive: true,
      userId: 'U001',
    });

    const dbError = new Error('Database connection failed');
    mockedRegisterReporterToMaster.mockRejectedValue(dbError);

    let errorThrown: any = null;
    try {
      await registerReporter(input);
    } catch (error: any) {
      errorThrown = error;
    }

    expect(errorThrown).toBeInstanceOf(RegistrationFailed);
    expect(errorThrown?.message).toBe('報告者の登録に失敗しました。システム管理者に連絡してください。');

    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
