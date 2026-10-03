import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { registerReporter, RegisterReporterInput } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

const mockedRegisterReporterToMaster = jest.mocked(userMasterPersistence.registerReporterToMaster);

describe('SCEN-342: 退職または他部門異動の場合、br-tx_7-002により削除操作が決定される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not call registerReporter when memberChangeType is 退職', async () => {
    const input: RegisterReporterInput = {
      userId: 'R001',
      reporterName: '退職者太郎',
      emailAddress: 'retired@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
  });

  it('should not call registerReporter when memberChangeType is 他部門異動', async () => {
    const input: RegisterReporterInput = {
      userId: 'R002',
      reporterName: '異動者太郎',
      emailAddress: 'moved-dept@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
  });
});
