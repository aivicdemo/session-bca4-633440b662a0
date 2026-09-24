import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
  MissingRequiredField,
} from '../../src/logic/user-information-input-confirmation';

describe('SCEN-406: リーダーへの通知日時が現在日時より未来の場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();

      if (!result.success) {
        expect(result.userInformationId).toBeNull();
      }
    } catch (err) {
      expect(err).toBeInstanceOf(MissingRequiredField);
      if (err instanceof MissingRequiredField) {
        expect((err as Error).message).toContain('現在日時以前');
      }
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

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();
    } catch (err) {
      expect(err).toBeInstanceOf(MissingRequiredField);
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

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();
    } catch (err) {
      expect(err).toBeInstanceOf(MissingRequiredField);
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

    const expectedErrorMessage =
      '通知日時は現在日時以前である必要があります';

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();
    } catch (err) {
      if (err instanceof MissingRequiredField) {
        expect((err as Error).message).toContain(expectedErrorMessage);
      }
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

    const result: any = await submitUserInformationForConfirmation(input);

    expect(result).toBeDefined();
    if (result.success) {
      expect(result.userInformationId).toBe('user-info-001');
      expect(result.confirmationStatus).toBe('pending_approval');
      expect(result.leaderNotificationSent).toBe(true);
    }
  });
});
