jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-596: メールタイプフィルターがnull の場合、全タイプのメール送信履歴が対象に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールタイプフィルターがnullの場合、全タイプのメール送信履歴が含まれる', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const mockHistoryRecords = [
      {
        historyId: 'EH-001',
        recipientId: 'USER-001',
        recipientEmail: 'user1@example.com',
        emailType: 'daily_report_submission',
        sentTime: '2024-01-15T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'EH-002',
        recipientId: 'USER-002',
        recipientEmail: 'user2@example.com',
        emailType: 'non_submission_prompt',
        sentTime: '2024-01-15T10:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'EH-003',
        recipientId: 'USER-003',
        recipientEmail: 'user3@example.com',
        emailType: 'reminder_notification',
        sentTime: '2024-01-15T10:30:00Z',
        sendingStatus: 'failed',
        errorMessage: 'SMTP timeout',
      },
      {
        historyId: 'EH-004',
        recipientId: 'USER-004',
        recipientEmail: 'user4@example.com',
        emailType: 'user_information_approval',
        sentTime: '2024-01-15T11:00:00Z',
        sendingStatus: 'pending',
        errorMessage: null,
      },
    ];

    (retrieveEmailSendingHistoryByDateRange as jest.Mock).mockResolvedValue(mockHistoryRecords);

    const result = await retrieveEmailSendingHistoryDetails({
      leaderId,
      startDate,
      endDate,
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.emailHistoryList).toHaveLength(4);
    expect(result.emailHistoryList.some(h => h.emailType === 'daily_report_submission')).toBe(true);
    expect(result.emailHistoryList.some(h => h.emailType === 'non_submission_prompt')).toBe(true);
    expect(result.emailHistoryList.some(h => h.emailType === 'reminder_notification')).toBe(true);
    expect(result.emailHistoryList.some(h => h.emailType === 'user_information_approval')).toBe(true);
    expect(result.totalCount).toBe(4);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);
  });
});
