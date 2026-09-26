import { updateReporter } from '../../src/logic/reporter-master-management';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-372: updateReporter with reporter name change', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update reporter name and record change history', async () => {
    const input = {
      reporterId: 'RPT001',
      reporterName: '田中花子',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    (validationModule.validateReporterNameFormat as jest.Mock).mockResolvedValue(true);
    (persistenceModule.retrieveReporterByUserId as jest.Mock).mockResolvedValue({
      reporterId: 'RPT001',
      userId: 'USER001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: '営業部',
      status: 'active',
    });
    (persistenceModule.updateReporterInMaster as jest.Mock).mockResolvedValue(true);
    (persistenceModule.persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue('CHG20250115001');

    const result = await updateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT001');
    expect(result.message).toMatch(/正常に更新|更新されました/);
    expect(result.changeHistoryId).toBe('CHG20250115001');
  });
});
