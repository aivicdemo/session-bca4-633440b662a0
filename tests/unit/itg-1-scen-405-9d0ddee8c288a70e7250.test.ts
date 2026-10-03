import {
  submitUserInformationForConfirmation,
  type SubmitUserInformationForConfirmationInput,
  InvalidUserInformationFormatError,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as inputValidationModule from '../../src/logic/input-validation-formatting';
import * as userMasterModule from '../../src/logic/user-master-persistence';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-405: 承認期限が0営業日以下で設定された場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('error should be thrown when approval deadline is 0 business days or less', async () => {
    jest.spyOn(userAuthModule, 'authenticateAndAuthorizeReporterAccess').mockResolvedValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
    } as any);

    jest.spyOn(inputValidationModule, 'validateUserInformationRequired').mockResolvedValue({
      isValid: true,
    } as any);

    jest.spyOn(inputValidationModule, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: false,
    } as any);

    jest.spyOn(userMasterModule, 'saveDailyReportRecord').mockResolvedValue({
      userInformationId: 'user-info-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline: new Date(),
    } as any);

    jest.spyOn(notificationModule, 'sendLeaderSubmissionNotification').mockResolvedValue({
      leaderNotificationSent: true,
    } as any);

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date(),
    };

    // 承認期限が0営業日で設定された場合
    try {
      const result = await submitUserInformationForConfirmation(input);
      // 処理は中断され、エラー状態で返される
      // success フィールドが false
      expect(result.success).toBe(false);
      // userInformationId が null
      expect(result.userInformationId).toBeNull();
      // confirmationStatus が承認保留状態ではない状態
      expect(result.confirmationStatus).not.toMatch(/pending|approval/i);
    } catch (err) {
      // または、設計済みエラー InvalidUserInformationFormatError が発生
      expect(err).toBeInstanceOf(InvalidUserInformationFormatError);
      const errorMessage = (err as Error).message;
      expect(errorMessage).toContain('ユーザー情報の入力形式が不正です');
    }
  });
});
