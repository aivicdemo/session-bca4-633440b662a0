import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { registerReporter, RegisterReporterInput, RegisterReporterOutput } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

const mockedValidateReporterNameFormat = jest.mocked(inputValidation.validateReporterNameFormat);
const mockedValidateEmailAddress = jest.mocked(inputValidation.validateEmailAddress);
const mockedDetectDuplicateEmailAddress = jest.mocked(inputValidation.detectDuplicateEmailAddress);
const mockedRegisterReporterToMaster = jest.mocked(userMasterPersistence.registerReporterToMaster);
const mockedPersistReporterMasterChangeHistory = jest.mocked(userMasterPersistence.persistReporterMasterChangeHistory);

describe('SCEN-341: 異動で既存報告者IDが存在する場合、br-tx_7-002により更新操作が決定される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update existing reporter when memberChangeType is 異動', async () => {
    // Setup mocks
    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '異動後太郎',
      errorCode: null
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'moved@example.com',
      errorCode: null
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'moved@example.com',
      errorCode: null
    });

    mockedRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterId: 'R001',
      message: 'Reporter updated'
    });

    mockedPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'CHG-001',
      message: 'History recorded'
    });

    // Call function
    const input: RegisterReporterInput = {
      userId: 'R001',
      reporterName: '異動後太郎',
      emailAddress: 'moved@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now
    };

    const result = await registerReporter(input);

    // Verify result
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toContain('更新');
    expect(result.changeHistoryId).toBe('CHG-001');

    // Verify registerReporterToMaster was called
    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();

    // Verify persistReporterMasterChangeHistory was called with UPDATE operation
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'update',
        reporterId: 'R001',
        leaderUserId: 'TL001'
      })
    );
  });
});
