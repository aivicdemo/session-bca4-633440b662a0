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

import { registerReporter, RegisterReporterInput, InvalidReporterNameFormat } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

describe('SCEN-328: registerReporter - Empty reporter name', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return error response when reporter name is empty string', async () => {
    const executionTimestamp = new Date('2024-01-15T10:00:00+09:00');
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    // Mock validateReporterNameFormat to throw error for empty string
    jest.spyOn(inputValidation, 'validateReporterNameFormat').mockRejectedValue(
      new InvalidReporterNameFormat('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。')
    );

    const result = await registerReporter(input);

    // Verify error response
    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.changeHistoryId).toBe(null);
    expect(result.message).toContain('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。');

    // Verify that registerReporterToMaster and persistReporterMasterChangeHistory were NOT called
    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
