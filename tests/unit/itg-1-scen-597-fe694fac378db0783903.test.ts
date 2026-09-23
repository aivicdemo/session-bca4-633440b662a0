import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  RetrieveEmailSendingHistoryDetailsInput,
  RetrieveEmailSendingHistoryDetailsOutput,
  EmailHistoryDetail,
} from '../../src/logic/daily-report-management-view';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';
import * as dailyReportManagementView from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-management-view');

describe('SCEN-597: 送信ステータスフィルターがnullの場合、全ステータスのメール送信履歴が対象に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include all sending statuses when sendingStatus is null', async () => {
    const mockEmailHistories = [
      {
        historyId: 'history-1',
        recipientId: 'user-1',
        recipientEmail: 'user1@example.com',
        recipientName: 'User 1',
        emailType: 'daily_report_submission',
        subject: 'Subject 1',
        sentTime: '2024-01-15T10:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'history-2',
        recipientId: 'user-2',
        recipientEmail: 'user2@example.com',
        recipientName: 'User 2',
        emailType: 'reminder_notification',
        subject: 'Subject 2',
        sentTime: '2024-01-15T10:30:00Z',
        sendingStatus: 'failed',
        errorMessage: 'Connection timeout',
      },
      {
        historyId: 'history-3',
        recipientId: 'user-3',
        recipientEmail: 'user3@example.com',
        recipientName: 'User 3',
        emailType: 'user_information_approval',
        subject: 'Subject 3',
        sentTime: '2024-01-15T11:00:00Z',
        sendingStatus: 'pending',
        errorMessage: null,
      },
    ];

    (userMasterPersistence.retrieveEmailSendingHistoryByDateRange as any).mockResolvedValue(
      mockEmailHistories
    );

    const mockFormattedHistories: EmailHistoryDetail[] = mockEmailHistories.map((h) => ({
      historyId: h.historyId,
      recipientId: h.recipientId,
      recipientEmail: h.recipientEmail,
      recipientName: h.recipientName,
      emailType: h.emailType,
      subject: h.subject,
      sentTime: h.sentTime,
      sendingStatus: h.sendingStatus,
      errorMessage: h.errorMessage,
    }));

    (dailyReportManagementView.formatEmailHistoryForDisplay as any).mockReturnValue(
      mockFormattedHistories
    );

    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader_001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = (await retrieveEmailSendingHistoryDetails(input)) as RetrieveEmailSendingHistoryDetailsOutput;

    expect(result.emailHistoryList.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);
    expect(result.emailHistoryList.map((h) => h.sendingStatus)).toContain('success');
    expect(result.emailHistoryList.map((h) => h.sendingStatus)).toContain('failed');
    expect(result.emailHistoryList.map((h) => h.sendingStatus)).toContain('pending');
  });
});
