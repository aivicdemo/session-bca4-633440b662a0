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

describe('SCEN-346: 削除対象のメンバーが過去7日以内に日報を提出している場合、br-tx_7-002の制約3により「最近の日報があります。削除前に確認してください」警告が返される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '削除対象メンバー名',
      errorCode: null
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'delete.member@example.com',
      errorCode: null
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'delete.member@example.com',
      errorCode: null
    });
  });

  it('should return warning when deleted member has recent daily reports', async () => {
    mockedRegisterReporterToMaster.mockResolvedValue({
      success: false,
      reporterId: null,
      message: '最近の日報があります。削除前に確認してください'
    });

    const input: RegisterReporterInput = {
      userId: 'reporter-001',
      reporterName: '削除対象メンバー名',
      emailAddress: 'delete.member@example.com',
      teamLeaderId: 'teamleader-001',
      executionTimestamp: now
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('最近の日報があります。削除前に確認してください');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
