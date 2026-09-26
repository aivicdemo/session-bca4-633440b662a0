import { updateReporter, UnauthorizedUpdateError } from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-377: updateReporter without authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedUpdateError when team leader does not have permission', async () => {
    const input = {
      reporterId: 'reporter-C',
      reporterName: 'Updated Name',
      teamLeaderId: 'leader-A',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    (persistenceModule.retrieveReporterByUserId as jest.Mock).mockResolvedValue({
      reporterId: 'reporter-C',
      teamId: 'team-B',
    });

    await expect(updateReporter(input)).rejects.toThrow(UnauthorizedUpdateError);
    await expect(updateReporter(input)).rejects.toThrow('この操作を実行する権限がありません。');
    
    expect(persistenceModule.updateReporterInMaster).not.toHaveBeenCalled();
    expect(persistenceModule.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
