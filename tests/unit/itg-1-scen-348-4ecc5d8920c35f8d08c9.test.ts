import { registerReporter, RegisterReporterInput, RegisterReporterOutput, InvalidReporterNameFormat } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
}));

describe('SCEN-348: 報告者名が空の場合、br-tx_7-003の制約1により「氏名は必須です」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reporterName=空文字列の場合、エラーメッセージが返される', async () => {
    const mockValidateReporterNameFormat = jest.mocked(inputValidation.validateReporterNameFormat);
    mockValidateReporterNameFormat.mockRejectedValue(
      new InvalidReporterNameFormat('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。')
    );

    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '',
      emailAddress: 'reporter@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
