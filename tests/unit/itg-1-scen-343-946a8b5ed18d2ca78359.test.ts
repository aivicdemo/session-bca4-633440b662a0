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

describe('SCEN-343: 休職のメンバーの場合、br-tx_7-002により更新操作が決定される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null
    });

    mockedRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'Reporter updated'
    });

    mockedPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'history-20250115-001',
      message: 'History recorded'
    });
  });

  it('should update on-leave member when memberChangeType is 休職', async () => {
    const input: RegisterReporterInput = {
      userId: 'user-on-leave-001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: now
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.message).toContain('更新');
    expect(result.changeHistoryId).toBe('history-20250115-001');

    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'update',
        reporterId: 'reporter-001',
        leaderUserId: 'leader-001'
      })
    );
  });
});
