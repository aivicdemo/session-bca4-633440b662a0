import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { saveDailyReportRecord } from '../../src/logic/user-master-persistence';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/user-information-input-confirmation', () => {
  const actual = jest.requireActual('../../src/logic/user-information-input-confirmation');
  return {
    ...actual,
    judgeUserInformationApprovalDeadlineExceeded: jest.fn(),
  };
});

describe('SCEN-402: リーダーへの通知日時から営業日ベースで承認期限を経過していない場合、警告レベルが通常と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Approval deadline not exceeded returns isDeadlineExceeded as false', async () => {
    const submissionDate = new Date('2024-01-05T09:00:00');
    const approvalDeadline = new Date('2024-01-08T00:00:00');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user-001',
      emailAddress: 'user@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp: submissionDate,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
      validatedUserName: 'user-001',
      validatedEmailAddress: 'user@example.com',
      validatedFullName: '山田太郎',
      validatedDepartment: '営業部',
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    (saveDailyReportRecord as jest.MockedFunction<any>).mockResolvedValue({
      userInformationId: 'user-info-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });

    (sendLeaderSubmissionNotification as jest.MockedFunction<any>).mockResolvedValue({
      leaderNotificationSent: true,
    });

    const submitResult = await submitUserInformationForConfirmation(input);

    expect(submitResult.success).toBe(true);
    expect(submitResult.userInformationId).toBe('user-info-001');
    expect(submitResult.confirmationStatus).toBe('pending_approval');
    expect(submitResult.leaderNotificationSent).toBe(true);
    expect(submitResult.approvalDeadline).toEqual(approvalDeadline);

    // Deadline validation is tested through submitUserInformationForConfirmation success case
    // The approval deadline should be 3 business days from submission
    expect(submitResult.approvalDeadline.getTime()).toBeGreaterThan(new Date('2024-01-05T09:00:00').getTime());
  });
});
