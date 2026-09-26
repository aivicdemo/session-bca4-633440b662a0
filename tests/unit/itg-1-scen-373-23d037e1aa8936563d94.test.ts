import { updateReporter, ReporterNotFoundError } from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-373: updateReporter with non-existent reporterId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReporterNotFoundError when reporter ID does not exist', async () => {
    const input = {
      reporterId: 'reporter-999',
      reporterName: '新しい名前',
      emailAddress: 'newemail@example.com',
      department: '営業部',
      status: 'active',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    (persistenceModule.retrieveReporterByUserId as jest.Mock).mockResolvedValue(null);

    await expect(updateReporter(input)).rejects.toThrow(ReporterNotFoundError);
    await expect(updateReporter(input)).rejects.toThrow('指定された報告者が見つかりません。');
    
    expect(persistenceModule.updateReporterInMaster).not.toHaveBeenCalled();
    expect(persistenceModule.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
