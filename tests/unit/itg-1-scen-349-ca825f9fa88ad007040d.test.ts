import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
  validateEmailAddress,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-349: メールアドレスが空の場合、br-tx_7-003の制約2により「メールアドレスは必須です」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('emailAddress=空文字列の場合、InvalidEmailAddressFormatエラーが発生し、エラーメッセージが返される', () => {
    // スタブ化
    (validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    (validateEmailAddress as jest.Mock).mockImplementation(() => {
      throw new InvalidEmailAddressFormat('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    });

    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: '',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result: RegisterReporterOutput = registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
