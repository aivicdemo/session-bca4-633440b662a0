import { registerReporter, InvalidOperationType } from '../../src/logic/reporter-master-management';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-369: registerReporter with invalid operationType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error message "不正な操作種別です" when invalid operationType is passed to recordMasterChangeLog', async () => {
    const input = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    (validationModule.validateReporterNameFormat as jest.Mock).mockResolvedValue({ isValid: true });
    (validationModule.validateEmailAddress as jest.Mock).mockResolvedValue({ isValid: true });
    (validationModule.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({ isDuplicate: false });
    (persistenceModule.registerReporterToMaster as jest.Mock).mockResolvedValue('REP001');
    (persistenceModule.persistReporterMasterChangeHistory as jest.Mock).mockImplementation(() => {
      throw new InvalidOperationType('不正な操作種別です');
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });
});
