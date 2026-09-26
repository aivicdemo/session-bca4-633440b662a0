import { updateReporter, DuplicateEmailAddressError } from '../../src/logic/reporter-master-management';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-374: updateReporter with duplicate email address', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DuplicateEmailAddressError when email is already used by another reporter', async () => {
    const input = {
      reporterId: 'reporter-001',
      emailAddress: 'reporter-b@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    (persistenceModule.updateReporterInMaster as jest.Mock).mockResolvedValue(true);
    (validationModule.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue(true);
    (validationModule.validateEmailAddress as jest.Mock).mockResolvedValue(true);
    (validationModule.validateReporterNameFormat as jest.Mock).mockResolvedValue(true);
    (persistenceModule.retrieveReporterByUserId as jest.Mock).mockResolvedValue({
      reporterId: 'reporter-001',
      teamLeaderId: 'leader-001',
    });
    (persistenceModule.persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue(true);

    await expect(updateReporter(input)).rejects.toThrow(DuplicateEmailAddressError);
    
    expect(persistenceModule.updateReporterInMaster).not.toHaveBeenCalled();
    expect(persistenceModule.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
