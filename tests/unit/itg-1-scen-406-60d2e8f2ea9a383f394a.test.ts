import {
  submitUserInformationForConfirmation,
  type SubmitUserInformationForConfirmationInput,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as inputValidationModule from '../../src/logic/input-validation-formatting';
import * as userMasterModule from '../../src/logic/user-master-persistence';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-406: リーダーへの通知日時が現在日時より未来の場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('error should be thrown when notificationTimestamp is in the future', async () => {
    // notificationTimestamp を現在日時より 1 時間未来の Date オブジェクト
    const futureDateTimeOneHourAhead = new Date();
    futureDateTimeOneHourAhead.setHours(futureDateTimeOneHourAhead.getHours() + 1);

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

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: futureDateTimeOneHourAhead,
    };

    // 処理は中断され、ユーザー情報の保存・リーダーへの通知は実行されない
    expect(async () => {
      await submitUserInformationForConfirmation(input);
    }).rejects.toThrow();

    // ユーザー情報の保存（saveDailyReportRecord）は実行されない
    expect(userMasterModule.saveDailyReportRecord).not.toHaveBeenCalled();

    // リーダーへの通知送信（sendLeaderSubmissionNotification）は実行されない
    expect(notificationModule.sendLeaderSubmissionNotification).not.toHaveBeenCalled();

    // スローされる例外メッセージに『通知日時は現在日時以前である必要があります』を含む
    try {
      await submitUserInformationForConfirmation(input);
    } catch (err) {
      expect((err as Error).message).toContain('通知日時は現在日時以前である必要があります');
    }
  });
});
