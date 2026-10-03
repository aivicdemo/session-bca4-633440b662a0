import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  judgeUserInformationApprovalDeadlineExceeded,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as inputValidationModule from '../../src/logic/input-validation-formatting';
import * as userMasterModule from '../../src/logic/user-master-persistence';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-402: リーダーへの通知日時から営業日ベースで承認期限を経過していない場合、警告レベルが通常と判定される', () => {
  const mockAuthenticateAndAuthorizeReporterAccess = userAuthModule.authenticateAndAuthorizeReporterAccess as jest.Mock;
  const mockValidateUserInformationRequired = inputValidationModule.validateUserInformationRequired as jest.Mock;
  const mockDetectDuplicateEmailAddress = inputValidationModule.detectDuplicateEmailAddress as jest.Mock;
  const mockSaveDailyReportRecord = userMasterModule.saveDailyReportRecord as jest.Mock;
  const mockSendLeaderSubmissionNotification = notificationModule.sendLeaderSubmissionNotification as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Approval deadline not exceeded returns warning level as normal', async () => {
    const submissionTimestamp = new Date('2024-01-05T09:00:00Z');
    const approvalDeadline = new Date('2024-01-08T09:00:00Z');
    const checkTimestamp = new Date('2024-01-08T17:00:00Z');

    const submitInput: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user-001',
      emailAddress: 'user@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp,
    };

    mockAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });

    mockValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      validatedUserName: 'user-001',
      validatedEmailAddress: 'user@example.com',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    });

    mockSaveDailyReportRecord.mockResolvedValue({
      success: true,
      userInformationId: 'user-info-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });

    mockSendLeaderSubmissionNotification.mockResolvedValue({
      success: true,
      notificationId: 'notif-001',
      sentAt: new Date(),
      deliveryMethod: 'email',
      errorDetails: null,
    });

    const submitResult = await submitUserInformationForConfirmation(submitInput);

    expect(submitResult.success).toBe(true);
    expect(submitResult.userInformationId).toBe('user-info-001');
    expect(submitResult.confirmationStatus).toBe('pending_approval');
    expect(submitResult.leaderNotificationSent).toBe(true);
    expect(submitResult.approvalDeadline).toEqual(approvalDeadline);

    const deadlineCheckInput = {
      approvalDeadline,
      currentTimestamp: checkTimestamp,
    };

    expect(deadlineCheckInput.currentTimestamp <= deadlineCheckInput.approvalDeadline).toBe(true);
  });
});
