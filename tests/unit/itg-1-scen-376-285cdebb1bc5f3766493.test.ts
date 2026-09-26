import { updateReporter, InvalidReporterNameFormatError } from '../../src/logic/reporter-master-management';
import * as validationModule from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-376: updateReporter with invalid reporter name format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when reporterName is empty string', async () => {
    const input = {
      reporterId: 'reporter-001',
      reporterName: '',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    (validationModule.validateReporterNameFormat as jest.Mock).mockImplementation(() => {
      throw new InvalidReporterNameFormatError('報告者名の形式が正しくありません。');
    });

    const result = await updateReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者名の形式が正しくありません。');
    expect(result.changeHistoryId).toBeNull();
  });
});
