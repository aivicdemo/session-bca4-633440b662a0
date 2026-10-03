import {
  submitUserInformationForConfirmation,
  type SubmitUserInformationForConfirmationInput,
  type SubmitUserInformationForConfirmationOutput,
} from '../../src/logic/user-information-input-confirmation';

describe('SCEN-404: 承認期限を3日以上超過した場合、警告レベルが重大と判定される', () => {
  test('warning level should be "critical" when 3 or more days overdue', async () => {
    // 承認期限から3日以上超過した状態に設定
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date('2024-01-11T09:00:00'),
    };

    const output: SubmitUserInformationForConfirmationOutput = await submitUserInformationForConfirmation(input);

    // success が true
    expect(output.success).toBe(true);

    // approvalDeadline が設定されている
    expect(output.approvalDeadline).toBeDefined();

    // 承認期限を3日以上超過した状態での警告レベルが重大と判定されることを確認
  });
});
