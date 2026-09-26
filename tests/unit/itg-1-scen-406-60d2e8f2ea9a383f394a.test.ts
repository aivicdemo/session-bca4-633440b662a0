import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { saveDailyReportRecord } from '../../src/logic/user-master-persistence';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-406: リーダーへの通知日時が現在日時より未来の場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('notificationTimestampが現在日時より未来の場合、エラーが発生する', async () => {
    const futureDateTimeOneHourAhead = new Date();
    futureDateTimeOneHourAhead.setHours(
      futureDateTimeOneHourAhead.getHours() + 1
    );

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: futureDateTimeOneHourAhead,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    try {
      await submitUserInformationForConfirmation(input);
      fail('Expected error to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain('現在日時以前');
    }
  });

  it('エラー発生時、ユーザー情報の保存（saveDailyReportRecord）は実行されない', async () => {
    const futureDateTimeOneHourAhead = new Date();
    futureDateTimeOneHourAhead.setHours(
      futureDateTimeOneHourAhead.getHours() + 1
    );

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: futureDateTimeOneHourAhead,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    try {
      await submitUserInformationForConfirmation(input);
      fail('Expected error to be thrown');
    } catch (err) {
      expect(saveDailyReportRecord).not.toHaveBeenCalled();
    }
  });

  it('エラー発生時、リーダーへの通知送信（sendLeaderSubmissionNotification）は実行されない', async () => {
    const futureDateTimeOneHourAhead = new Date();
    futureDateTimeOneHourAhead.setHours(
      futureDateTimeOneHourAhead.getHours() + 1
    );

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: futureDateTimeOneHourAhead,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    try {
      await submitUserInformationForConfirmation(input);
      fail('Expected error to be thrown');
    } catch (err) {
      expect(sendLeaderSubmissionNotification).not.toHaveBeenCalled();
    }
  });

  it('スローされる例外メッセージに「通知日時は現在日時以前である必要があります」を含むことを確認する', async () => {
    const futureDateTimeOneHourAhead = new Date();
    futureDateTimeOneHourAhead.setHours(
      futureDateTimeOneHourAhead.getHours() + 1
    );

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: futureDateTimeOneHourAhead,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    try {
      await submitUserInformationForConfirmation(input);
      fail('Expected error to be thrown');
    } catch (err) {
      expect((err as Error).message).toContain('通知日時は現在日時以前である必要があります');
    }
  });

  it('通知日時が現在日時以前の場合、正常に処理が完了する', async () => {
    const pastDateTime = new Date();
    pastDateTime.setHours(pastDateTime.getHours() - 1);

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: pastDateTime,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    (saveDailyReportRecord as jest.MockedFunction<any>).mockResolvedValue({
      userInformationId: 'user-info-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline: new Date(),
    });

    (sendLeaderSubmissionNotification as jest.MockedFunction<any>).mockResolvedValue({
      leaderNotificationSent: true,
    });

    const result = await submitUserInformationForConfirmation(input);

    expect(result.success).toBe(true);
    expect(result.userInformationId).toBe('user-info-001');
    expect(result.confirmationStatus).toBe('pending_approval');
    expect(result.leaderNotificationSent).toBe(true);
  });
});
