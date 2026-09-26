import { registerReporter } from '../../src/logic/reporter-master-management';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-370: registerReporter with empty teamLeaderId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error message "実行者情報が取得できません" when teamLeaderId is empty', async () => {
    const input = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: '',
      executionTimestamp: new Date(),
    };

    (validationModule.validateReporterNameFormat as jest.Mock).mockResolvedValue({ isValid: true });
    (validationModule.validateEmailAddress as jest.Mock).mockResolvedValue({ isValid: true });
    (validationModule.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({ isDuplicate: false });
    (persistenceModule.registerReporterToMaster as jest.Mock).mockImplementation(() => {
      throw new Error('実行者情報が取得できません');
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();
  });
});
