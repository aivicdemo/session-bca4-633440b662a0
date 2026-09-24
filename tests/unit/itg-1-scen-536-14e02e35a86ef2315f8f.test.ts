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
  AllEmailSendingFailureError,
  type SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-536: 全ての未提出者へのメール送信に失敗したとき、AllEmailSendingFailureErrorが発生する', () => {
  const nonSubmittedReporters = [
    {
      userId: 'U001',
      userName: '田中太郎',
      userEmailAddress: 'tanaka@example.com',
      targetDate: '2024-01-15',
    },
    {
      userId: 'U002',
      userName: '鈴木花子',
      userEmailAddress: 'suzuki@example.com',
      targetDate: '2024-01-15',
    },
    {
      userId: 'U003',
      userName: '佐藤次郎',
      userEmailAddress: 'sato@example.com',
      targetDate: '2024-01-15',
    },
  ];

  const input: SendNonSubmissionPromptNotificationInput = {
    nonSubmittedReporters,
    leaderUserId: 'leader-001',
    leaderEmailAddress: 'leader@example.com',
    detectionLogId: 'detection-log-001',
    promptReason: '定時リマインダー',
    targetDate: '2024-01-15',
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateEmailAddressForDelivery.mockReturnValue(false);

    mockedBuildNotificationContent.mockReturnValue({
      subject: 'テスト件名',
      body: 'テスト本文',
    });

    mockedRecordEmailSendingHistory.mockImplementation((historyInput: any) => {
      const index = mockedRecordEmailSendingHistory.mock.calls.length;
      return {
        sendingHistoryId: `history-${String(index).padStart(3, '0')}`,
        recordedAt: new Date().toISOString(),
      };
    });
  });

  it('全ての対象者のメールアドレスが送信不可と判定されて、AllEmailSendingFailureErrorが発生する', async () => {
    let thrownError: any = null;
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch (e) {
      thrownError = e;
    }

    expect(thrownError).toBeInstanceOf(AllEmailSendingFailureError);
    expect(thrownError.message).toBe('全ての催促メール送信に失敗しました。');
  });

  it('例外がスローされ、出力型は返却されない', async () => {
    let thrownError: any = null;
    let result: any = undefined;
    try {
      result = await sendNonSubmissionPromptNotification(input);
    } catch (e) {
      thrownError = e;
    }

    expect(thrownError).toBeInstanceOf(AllEmailSendingFailureError);
    expect(result).toBeUndefined();
  });

  it('validateEmailAddressForDeliveryがすべての対象者に対して呼ばれ、全て送信不可を返す', async () => {
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch {
      // 例外発生予定
    }

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledTimes(3);
    nonSubmittedReporters.forEach((reporter) => {
      expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          emailAddress: reporter.userEmailAddress,
        })
      );
    });
  });

  it('buildNotificationContentがすべての対象者に対して呼ばれ、正常なメール本文を返す', async () => {
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch {
      // 例外発生予定
    }

    expect(mockedBuildNotificationContent).toHaveBeenCalledTimes(3);
  });

  it('recordEmailSendingHistoryがすべての対象者に対して呼ばれ、送信履歴IDを返す', async () => {
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch {
      // 例外発生予定
    }

    expect(mockedRecordEmailSendingHistory).toHaveBeenCalledTimes(3);
  });
});
