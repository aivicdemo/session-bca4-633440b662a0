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

describe('SCEN-350: メールアドレスが@を含まないか、ドメイン部分がない場合、br-tx_7-003の制約3により「正しいメールアドレス形式で入力してください」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('メールアドレスが@を含まない不正な形式の場合、InvalidEmailAddressFormatエラーが発生', () => {
    // スタブ化: validateReporterNameFormatは成功
    (validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    // validateEmailAddressが不正な形式でエラーを返す
    (validateEmailAddress as jest.Mock).mockImplementation(() => {
      throw new InvalidEmailAddressFormat('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    });

    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'test',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
