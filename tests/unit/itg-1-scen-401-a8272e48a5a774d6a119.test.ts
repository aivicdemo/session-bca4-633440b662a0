import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  UserInformationSubmissionFailedError,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as inputValidationModule from '../../src/logic/input-validation-formatting';
import * as userMasterModule from '../../src/logic/user-master-persistence';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-401: リーダーへの通知送信に失敗した場合、送信失敗エラーが発生する', () => {
  const mockAuthenticateAndAuthorizeReporterAccess = userAuthModule.authenticateAndAuthorizeReporterAccess as jest.Mock;
  const mockValidateUserInformationRequired = inputValidationModule.validateUserInformationRequired as jest.Mock;
  const mockDetectDuplicateEmailAddress = inputValidationModule.detectDuplicateEmailAddress as jest.Mock;
  const mockSaveDailyReportRecord = userMasterModule.saveDailyReportRecord as jest.Mock;
  const mockSendLeaderSubmissionNotification = notificationModule.sendLeaderSubmissionNotification as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Failed sendLeaderSubmissionNotification throws UserInformationSubmissionFailedError', async () => {
    const submissionTimestamp = new Date('2024-01-05T09:00:00Z');
    const approvalDeadline = new Date('2024-01-08T09:00:00Z');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'tanaka-user',
      emailAddress: 'tanaka@example.com',
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
      validatedUserName: 'tanaka-user',
      validatedEmailAddress: 'tanaka@example.com',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });

    mockSaveDailyReportRecord.mockResolvedValue({
      success: true,
      userInformationId: 'info-12345',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });

    mockSendLeaderSubmissionNotification.mockRejectedValue(
      new UserInformationSubmissionFailedError(
        'ユーザー情報の送信に失敗しました。システム管理者に連絡してください。'
      )
    );

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(UserInformationSubmissionFailedError);
    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow('ユーザー情報の送信に失敗しました。システム管理者に連絡してください。');
  });
});
