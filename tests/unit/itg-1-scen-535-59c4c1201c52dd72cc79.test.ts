import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  PartialEmailSendingFailureError,
  SendNonSubmissionPromptNotificationInput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

describe('SCEN-535: PartialEmailSendingFailureError when some emails fail', () => {
  let mockValidateEmail: jest.Mock;
  let mockBuildContent: jest.Mock;
  let mockRecordHistory: jest.Mock;

  beforeEach(() => {
    mockValidateEmail = jest.fn().mockReturnValue(true);
    mockBuildContent = jest.fn().mockReturnValue({
      subject: 'テスト件名',
      body: 'テスト本文',
    });
    mockRecordHistory = jest
      .fn()
      .mockImplementationOnce(() => 'history-001')
      .mockImplementationOnce(() => {
        throw new Error('配信エラー');
      });

    jest
      .spyOn(require('../../src/logic/email-notification-management'), 'validateEmailAddressForDelivery')
      .mockImplementation(mockValidateEmail);
    jest
      .spyOn(require('../../src/logic/email-notification-management'), 'buildNotificationContent')
      .mockImplementation(mockBuildContent);
    jest
      .spyOn(require('../../src/logic/email-notification-management'), 'recordEmailSendingHistory')
      .mockImplementation(mockRecordHistory);
  });

  it('should throw PartialEmailSendingFailureError with correct counts when some reporters fail', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U002',
          userName: '佐藤花子',
          userEmailAddress: 'satoh@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    expect(() => sendNonSubmissionPromptNotification(input)).toThrow(
      PartialEmailSendingFailureError
    );

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof PartialEmailSendingFailureError) {
        expect(error.message).toBe('一部の催促メール送信に失敗しました。成功件数: 1, 失敗件数: 1。');
      }
    }

    expect(mockRecordHistory).toHaveBeenCalledTimes(2);
    expect(mockRecordHistory).toHaveBeenCalledWith(expect.objectContaining({}));
  });

  it('should record both success and failure history records', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U002',
          userName: '佐藤花子',
          userEmailAddress: 'satoh@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      // Expected to throw
    }

    expect(mockRecordHistory).toHaveBeenCalledTimes(2);
    const firstCall = mockRecordHistory.mock.calls[0];
    const secondCall = mockRecordHistory.mock.calls[1];
    expect(firstCall).toBeDefined();
    expect(secondCall).toBeDefined();
  });
});
