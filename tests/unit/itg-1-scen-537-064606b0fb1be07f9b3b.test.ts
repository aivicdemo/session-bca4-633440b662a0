jest.mock('../../src/logic/email-notification-management', () => {
  const actual = jest.requireActual('../../src/logic/email-notification-management');
  return {
    ...actual,
    validateEmailAddressForDelivery: jest.fn(),
    buildNotificationContent: jest.fn(),
    recordEmailSendingHistory: jest.fn(),
  };
});

import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  EmailServiceUnavailableError,
  type SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-537: メール送信サービスが利用不可のとき、EmailServiceUnavailableErrorが発生する', () => {
  const nonSubmittedReporters = [
    {
      userId: 'U001',
      userName: '田中太郎',
      userEmailAddress: 'tanaka@example.com',
      targetDate: '2024-01-15',
    },
  ];

  const input: SendNonSubmissionPromptNotificationInput = {
    nonSubmittedReporters,
    leaderUserId: 'L001',
    leaderEmailAddress: 'leader@example.com',
    detectionLogId: 'LOG-001',
    promptReason: '定時リマインダー',
    targetDate: '2024-01-15',
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateEmailAddressForDelivery.mockReturnValue(true);

    mockedBuildNotificationContent.mockReturnValue({
      subject: '【催促】日報未提出のお知らせ',
      body: '本日の日報がまだ提出されていません。お急ぎください。',
    });

    mockedRecordEmailSendingHistory.mockReturnValue({
      sendingHistoryId: 'history-001',
      recordedAt: new Date().toISOString(),
    });
  });

  it('メール送信サービスが利用不可でEmailServiceUnavailableErrorが発生する', async () => {
    let thrownError: any = null;
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch (e) {
      thrownError = e;
    }

    expect(thrownError).toBeInstanceOf(EmailServiceUnavailableError);
    expect(thrownError.message).toBe('メール送信サービスが一時的に利用不可です。');
  });

  it('関数の実行が中断され、SendNonSubmissionPromptNotificationOutput型の戻り値は返却されない', async () => {
    let thrownError: any = null;
    let result: any = undefined;
    try {
      result = await sendNonSubmissionPromptNotification(input);
    } catch (e) {
      thrownError = e;
    }

    expect(thrownError).toBeInstanceOf(EmailServiceUnavailableError);
    expect(result).toBeUndefined();
  });

  it('リーダーのメールアドレスが有効として検証される', async () => {
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch {
      // 例外発生予定
    }

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'leader@example.com',
      })
    );
  });

  it('催促メール本文が生成される', async () => {
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch {
      // 例外発生予定
    }

    expect(mockedBuildNotificationContent).toHaveBeenCalled();
  });

  it('送信履歴が記録される', async () => {
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch {
      // 例外発生予定
    }

    expect(mockedRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
