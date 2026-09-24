import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
  judgeUserInformationApprovalDeadlineExceeded,
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

  test('Approval deadline not exceeded returns warningLevel as normal', () => {
    const submissionDate = new Date('2024-01-05T09:00:00');
    const approvalDeadline = new Date('2024-01-08T00:00:00');
    const currentTimestamp = new Date('2024-01-08T17:00:00');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user-001',
      emailAddress: 'user@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp: submissionDate,
    };

    (authenticateAndAuthorizeReporterAccess as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
    });

    (validateUserInformationRequired as jest.Mock).mockReturnValue({
      isValid: true,
      validatedUserName: 'user-001',
      validatedEmailAddress: 'user@example.com',
      validatedFullName: '山田太郎',
      validatedDepartment: '営業部',
    });

    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue({
      isDuplicate: false,
    });

    (saveDailyReportRecord as jest.Mock).mockReturnValue({
      userInformationId: 'user-info-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });

    (sendLeaderSubmissionNotification as jest.Mock).mockReturnValue({
      leaderNotificationSent: true,
    });

    const submitResult: SubmitUserInformationForConfirmationOutput = submitUserInformationForConfirmation(input);

    expect(submitResult.success).toBe(true);
    expect(submitResult.userInformationId).toBe('user-info-001');
    expect(submitResult.confirmationStatus).toBe('pending_approval');
    expect(submitResult.leaderNotificationSent).toBe(true);
    expect(submitResult.approvalDeadline).toEqual(approvalDeadline);

    // Validate approval deadline
    (judgeUserInformationApprovalDeadlineExceeded as jest.Mock).mockReturnValue({
      userInfoId: 'user-info-001',
      isDeadlineExceeded: false,
      daysOverdue: 0,
      warningLevel: 'normal',
    });

    const validateResult = judgeUserInformationApprovalDeadlineExceeded({
      userInfoId: 'user-info-001',
      notificationTimestamp: submissionDate,
      approvalDeadlineDays: 3,
      currentTimestamp,
    });

    expect(validateResult.userInfoId).toBe('user-info-001');
    expect(validateResult.isDeadlineExceeded).toBe(false);
    expect(validateResult.daysOverdue).toBe(0);
    expect(validateResult.warningLevel).toBe('normal');
  });
});
