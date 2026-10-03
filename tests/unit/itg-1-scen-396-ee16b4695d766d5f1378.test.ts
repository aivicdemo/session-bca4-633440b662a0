import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as inputValidationModule from '../../src/logic/input-validation-formatting';
import * as userMasterModule from '../../src/logic/user-master-persistence';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-396: 報告者が有効なアカウントで必須項目をすべて正しく入力してユーザー情報を送信すると、一意のIDが割り当てられ確認待ち状態になり、リーダーに通知される', () => {
  const mockAuthenticateAndAuthorizeReporterAccess = userAuthModule.authenticateAndAuthorizeReporterAccess as jest.Mock;
  const mockValidateUserInformationRequired = inputValidationModule.validateUserInformationRequired as jest.Mock;
  const mockDetectDuplicateEmailAddress = inputValidationModule.detectDuplicateEmailAddress as jest.Mock;
  const mockSaveDailyReportRecord = userMasterModule.saveDailyReportRecord as jest.Mock;
  const mockSendLeaderSubmissionNotification = notificationModule.sendLeaderSubmissionNotification as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Valid input returns success with userInformationId, confirmationStatus, leaderNotificationSent, and approvalDeadline', async () => {
    const submissionTimestamp = new Date('2024-01-05T09:00:00Z');
    const approvalDeadline = new Date('2024-01-08T09:00:00Z');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user-name-001',
      emailAddress: 'reporter@example.com',
      fullName: '田中太郎',
      department: '営業部',
      submissionTimestamp,
    };

    mockAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });

    mockValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      validatedUserName: 'user-name-001',
      validatedEmailAddress: 'reporter@example.com',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'reporter@example.com',
      errorCode: null,
    });

    mockSaveDailyReportRecord.mockResolvedValue({
      success: true,
      userInformationId: 'user-info-2024-001',
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

    const result = await submitUserInformationForConfirmation(input);

    expect(result.success).toBe(true);
    expect(result.userInformationId).toBe('user-info-2024-001');
    expect(result.userInformationId).not.toBeNull();
    expect(result.confirmationStatus).toBe('pending_approval');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.approvalDeadline).toEqual(approvalDeadline);
  });
});
