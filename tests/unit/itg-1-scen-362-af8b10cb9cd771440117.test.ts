import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockImplementation(() => {
    throw new InvalidEmailAddressFormat('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
  }),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-362: 報告者マスタの変更内容のメールアドレスが不正な形式の場合、br-tx_7-005の制約1により「メールアドレスが未入力または不正です。確認してください」エラーメッセージが返される', () => {
  test('emailAddress=@を含まない不正な形式の場合、InvalidEmailAddressFormatエラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'user001',
      reporterName: '山田太郎',
      emailAddress: 'invalid-email',
      teamLeaderId: 'leader001',
      executionTimestamp: new Date(),
    };

    try {
      await registerReporter(input);
      fail('Expected InvalidEmailAddressFormat to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEmailAddressFormat);
      expect(error.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    }
  });
});
