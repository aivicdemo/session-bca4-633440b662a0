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

import { registerReporter } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-340: 新入社員配属で既存報告者IDがない場合、br-tx_7-002により登録操作が決定される', () => {
  const now = new Date('2024-01-15T10:00:00Z');
  const input = {
    userId: 'USER-001',
    reporterName: '山田太郎',
    emailAddress: 'yamada.taro@company.example.com',
    teamLeaderId: 'TL-001',
    executionTimestamp: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新入社員配属シナリオで正常に報告者が登録される', async () => {
    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada.taro@company.example.com',
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada.taro@company.example.com',
      errorCode: null,
    });

    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId: 'USER-001',
    });

    mockedRegisterReporterToMaster.mockResolvedValue({
      reporterId: 'REPORTER-001',
    });

    mockedPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'HISTORY-001',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER-001');
    expect(result.message).toBe('報告者を正常に登録しました。');
    expect(result.changeHistoryId).toBe('HISTORY-001');

    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
