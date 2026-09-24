jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  formatEmailHistoryForDisplay,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-589: リーダー権限あり、指定日付範囲内のメール送信履歴が存在する場合、フィルター条件に合致した履歴を詳細表示形式で返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィルター条件に合致したメール送信履歴が詳細表示形式で返される', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const emailType = 'daily_report_submission';
    const sendingStatus = 'success';
    const recipientEmail = null;
    const pageNumber = 1;
    const pageSize = 10;

    const mockHistoryRecords = [
      {
        historyId: 'EH-001',
        recipientId: 'USER-001',
        recipientEmail: 'user@company.com',
        emailType: 'daily_report_submission',
        sentTime: '2024-01-15T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'EH-002',
        recipientId: 'USER-002',
        recipientEmail: 'user2@company.com',
        emailType: 'daily_report_submission',
        sentTime: '2024-01-15T09:31:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'EH-003',
        recipientId: 'USER-003',
        recipientEmail: 'user3@company.com',
        emailType: 'daily_report_submission',
        sentTime: '2024-01-16T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'EH-004',
        recipientId: 'USER-004',
        recipientEmail: 'user4@company.com',
        emailType: 'daily_report_submission',
        sentTime: '2024-01-17T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'EH-005',
        recipientId: 'USER-005',
        recipientEmail: 'user5@company.com',
        emailType: 'daily_report_submission',
        sentTime: '2024-01-18T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
    ];

    (retrieveEmailSendingHistoryByDateRange as jest.Mock).mockResolvedValue(mockHistoryRecords);

    const result = await retrieveEmailSendingHistoryDetails({
      leaderId,
      startDate,
      endDate,
      emailType,
      sendingStatus,
      recipientEmail,
      pageNumber,
      pageSize,
    });

    expect(result).toBeDefined();
    expect(result.emailHistoryList).toHaveLength(5);

    result.emailHistoryList.forEach((history, index) => {
      expect(history.sentTime).toBe(mockHistoryRecords[index].sentTime);
      expect(history.recipientEmail).toBe(mockHistoryRecords[index].recipientEmail);
      expect(history.sendingStatus).toBe('success');
      expect(history.errorMessage).toBeNull();
    });

    expect(result.totalCount).toBe(5);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);
  });
});
