import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { registerReporter, RegisterReporterInput } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

const mockedValidateReporterNameFormat = jest.mocked(inputValidation.validateReporterNameFormat);
const mockedValidateEmailAddress = jest.mocked(inputValidation.validateEmailAddress);
const mockedDetectDuplicateEmailAddress = jest.mocked(inputValidation.detectDuplicateEmailAddress);
const mockedRegisterReporterToMaster = jest.mocked(userMasterPersistence.registerReporterToMaster);
const mockedPersistReporterMasterChangeHistory = jest.mocked(userMasterPersistence.persistReporterMasterChangeHistory);

describe('SCEN-344: メンバーの変更内容が不明確な場合、br-tx_7-002の制約1により「変更内容を確認してください」警告が返される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '田中太郎',
      errorCode: null
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null
    });
  });

  it('should return warning when memberChangeType is empty string', async () => {
    const input: RegisterReporterInput = {
      userId: 'user-001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: now
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toContain('変更内容を確認してください');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('should return warning when memberChangeType is ambiguous', async () => {
    const input: RegisterReporterInput = {
      userId: 'user-001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: now
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toContain('変更内容を確認してください');
    expect(result.changeHistoryId).toBeNull();
    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
  });
});
