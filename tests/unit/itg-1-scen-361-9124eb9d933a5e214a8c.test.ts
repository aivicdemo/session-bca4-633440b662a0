import {
  registerReporter,
  RegisterReporterInput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockImplementation(() => {
    throw new InvalidEmailAddressFormat('メールアドレスが未入力または不正です。確認してください');
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

describe('SCEN-361: 報告者マスタの変更内容にメールアドレスが含まれていない場合、br-tx_7-005の制約1により「メールアドレスが未入力または不正です。確認してください」エラーメッセージが返される', () => {
  test('emailAddress=空文字列の場合、InvalidEmailAddressFormatエラーが発生する', async () => {
    const input: RegisterReporterInput = {
      userId: 'user001',
      reporterName: '山田太郎',
      emailAddress: '',
      teamLeaderId: 'leader001',
      executionTimestamp: new Date(),
    };

    await expect(registerReporter(input)).rejects.toThrow(InvalidEmailAddressFormat);
    await expect(registerReporter(input)).rejects.toThrow('メールアドレスが未入力または不正です。確認してください');
  });
});
