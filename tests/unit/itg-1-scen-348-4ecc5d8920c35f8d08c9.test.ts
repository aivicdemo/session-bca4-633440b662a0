import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-348: 報告者名が空の場合、br-tx_7-003の制約1により「氏名は必須です」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reporterName=空文字列の場合、InvalidReporterNameFormatエラーが発生し、エラーメッセージが返される', () => {
    // スタブ化: validateReporterNameFormatが空文字列でエラーを返す
    (validateReporterNameFormat as jest.Mock).mockImplementation(() => {
      throw new InvalidReporterNameFormat('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。');
    });

    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '',
      emailAddress: 'reporter@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
