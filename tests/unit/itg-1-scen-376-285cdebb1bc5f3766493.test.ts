import { updateReporter, InvalidReporterNameFormatError } from '../../src/logic/reporter-master-management';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  retrieveReporterByUserId: jest.fn(),
  updateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-376: 更新された報告者名が空文字列または許可された文字種を超えると、InvalidReporterNameFormatErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reporterNameに空文字列が設定されると、InvalidReporterNameFormatErrorが発生し、successがfalseで返される', async () => {
    const mockValidateReporterNameFormat = validationModule.validateReporterNameFormat as jest.MockedFunction<typeof validationModule.validateReporterNameFormat>;

    mockValidateReporterNameFormat.mockResolvedValue({
      isValid: false,
      validatedReporterName: null,
      errorCode: 'INVALID_NAME_FORMAT'
    });

    const input = {
      reporterId: 'reporter-001',
      reporterName: '',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result = await updateReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toContain('報告者名の形式が正しくありません。');
    expect(result.changeHistoryId).toBe(null);
  });
});
