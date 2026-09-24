jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-597: 送信ステータスフィルターがnull の場合、全ステータスのメール送信履歴が対象に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('送信ステータスフィルターがnullの場合、全ステータスのメール送信履歴が含まれる', async () => {
    const leaderId = 'leader_001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const mockHistoryRecords: any[] = [
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
        emailType: 'daily_report_submission',
        sentTime: '2024-01-15T10:00:00Z',
        sendingStatus: 'failed',
        errorMessage: 'SMTP error',
      },
      {
        historyId: 'EH-003',
        recipientId: 'USER-003',
        recipientEmail: 'user3@example.com',
        emailType: 'daily_report_submission',
        sentTime: '2024-01-15T10:30:00Z',
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

    expect(result.emailHistoryList).toHaveLength(3);
    expect(result.emailHistoryList.some(h => h.sendingStatus === 'success')).toBe(true);
    expect(result.emailHistoryList.some(h => h.sendingStatus === 'failed')).toBe(true);
    expect(result.emailHistoryList.some(h => h.sendingStatus === 'pending')).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);
  });
});
