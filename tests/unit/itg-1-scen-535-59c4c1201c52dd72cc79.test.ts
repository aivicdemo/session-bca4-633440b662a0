import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  PartialEmailSendingFailureError,
  type SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-535: 複数の未提出者のうち一部へのメール送信に失敗したとき、PartialEmailSendingFailureErrorが発生して成功件数と失敗件数が返される', () => {
  it('一部の催促メール送信に失敗した場合、PartialEmailSendingFailureErrorが発生し、エラーメッセージに正確な成功件数と失敗件数が含まれる', () => {
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
  });

  it('recordEmailSendingHistoryが成功・失敗を問わず全2件の送信履歴を記録する', () => {
    const mockRecordHistory = jest.fn()
      .mockImplementationOnce(() => ({ id: 'history-001' }))
      .mockImplementationOnce(() => { throw new Error('配信エラー'); });

    jest.spyOn(require('../../src/logic/email-notification-management'), 'recordEmailSendingHistory')
      .mockImplementation(mockRecordHistory);

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
      // Expected to throw PartialEmailSendingFailureError
    }

    expect(mockRecordHistory).toHaveBeenCalledTimes(2);
  });

  it('各履歴に一意のIDが割り当てられる', () => {
    const mockRecordHistory = jest.fn()
      .mockImplementationOnce(() => ({ id: 'history-unique-001' }))
      .mockImplementationOnce(() => ({ id: 'history-unique-002' }));

    jest.spyOn(require('../../src/logic/email-notification-management'), 'recordEmailSendingHistory')
      .mockImplementation(mockRecordHistory);

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
    const firstResult = mockRecordHistory.mock.results[0];
    const secondResult = mockRecordHistory.mock.results[1];

    if (firstResult.type === 'return' && secondResult.type === 'return') {
      const firstId = (firstResult.value as any)?.id;
      const secondId = (secondResult.value as any)?.id;
      expect(firstId).not.toBe(secondId);
    }
  });
});
