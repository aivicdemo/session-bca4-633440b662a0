import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
}));
jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
}));

import { registerReporter, RegisterReporterInput } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

describe('SCEN-327: registerReporter - Valid user ID, name, and email', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should register a new reporter with success response and change history ID', async () => {
    const now = new Date('2024-01-15T10:00:00+09:00');
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now,
    };

    // Mock validateReporterNameFormat - success
    jest.spyOn(inputValidation, 'validateReporterNameFormat').mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    // Mock validateEmailAddress - success
    jest.spyOn(inputValidation, 'validateEmailAddress').mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    // Mock detectDuplicateEmailAddress - no duplicate
    jest.spyOn(inputValidation, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    // Mock validateUserAccountActiveStatus - active
    jest.spyOn(userAuth, 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'U001',
      inactiveReason: null,
    });

    // Mock registerReporterToMaster
    jest.spyOn(userMasterPersistence, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: 'RPT-001',
      message: 'Reporter registered successfully',
    });

    // Mock persistReporterMasterChangeHistory
    jest.spyOn(userMasterPersistence, 'persistReporterMasterChangeHistory').mockResolvedValue({
      success: true,
      changeHistoryId: 'CHG-001',
      message: 'Change history recorded',
    });

    const result = await registerReporter(input);

    // Verify result
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toBe('報告者を正常に登録しました');
    expect(result.changeHistoryId).toBe('CHG-001');

    // Verify all stub functions were called
    expect(inputValidation.validateReporterNameFormat).toHaveBeenCalled();
    expect(inputValidation.validateEmailAddress).toHaveBeenCalled();
    expect(inputValidation.detectDuplicateEmailAddress).toHaveBeenCalled();
    expect(userAuth.validateUserAccountActiveStatus).toHaveBeenCalled();
    expect(userMasterPersistence.registerReporterToMaster).toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
