import {
  registerReporter,
  RegisterReporterInput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';

describe('SCEN-362: メールアドレスが不正な形式の場合、br-tx_7-005制約1により「メールアドレスが未入力または不正です。確認してください」エラーが返される', () => {
  it('形式不正なメールアドレスでInvalidEmailAddressFormatエラーが投げられる', async () => {
    const input: RegisterReporterInput = {
      userId: 'user001',
      reporterName: '山田太郎',
      emailAddress: 'invalid-email',
      teamLeaderId: 'leader001',
      executionTimestamp: new Date(),
    };

    await expect(registerReporter(input)).rejects.toThrow(InvalidEmailAddressFormat);
  });
});
