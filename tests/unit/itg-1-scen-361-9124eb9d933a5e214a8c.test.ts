import {
  registerReporter,
  RegisterReporterInput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';

describe('SCEN-361: メールアドレスが未入力の場合、br-tx_7-005制約1により「メールアドレスが未入力または不正です。確認してください」エラーが返される', () => {
  it('emptyメールアドレスでInvalidEmailAddressFormatエラーが投げられる', async () => {
    const input: RegisterReporterInput = {
      userId: 'user001',
      reporterName: 'テスト太郎',
      emailAddress: '',
      teamLeaderId: 'leader_001',
      executionTimestamp: new Date(),
    };

    await expect(registerReporter(input)).rejects.toThrow(InvalidEmailAddressFormat);
    await expect(registerReporter(input)).rejects.toThrow(
      'メールアドレスが未入力または不正です。確認してください'
    );
  });
});
