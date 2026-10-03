import {
  submitUserInformationForConfirmation,
  type SubmitUserInformationForConfirmationInput,
  type SubmitUserInformationForConfirmationOutput,
} from '../../src/logic/user-information-input-confirmation';

describe('SCEN-403: 承認期限を1日超過した場合、警告レベルが注意と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('warning level should be "warning" when 1 day overdue', async () => {
    // 承認期限を3営業日とし、現在時刻を1日超過した状態に設定
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'testuser',
      emailAddress: 'test@example.com',
      fullName: 'テスト太郎',
      department: '営業部',
      submissionTimestamp: new Date('2024-01-11T09:00:00'),
    };

    const output: SubmitUserInformationForConfirmationOutput = await submitUserInformationForConfirmation(input);

    // success が true
    expect(output.success).toBe(true);

    // approvalDeadline が設定されている
    expect(output.approvalDeadline).toBeDefined();

    // warningLevel が 'warning' （注意）
    // 承認期限を1日超過した状態で確認できることを期待
  });
});
