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

describe('SCEN-598: 送信先メールアドレスフィルターがnullの場合、メールアドレスによるフィルタリングが適用されない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not apply recipient email filtering when recipientEmail is null', async () => {
    const mockEmailHistories = [
      {
        historyId: 'history-A',
        recipientId: 'user-1',
        recipientEmail: 'user1@example.com',
        recipientName: 'User 1',
        emailType: 'daily_report_submission',
        subject: 'Subject A',
        sentTime: '2024-01-15T10:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'history-B',
        recipientId: 'user-2',
        recipientEmail: 'user2@example.com',
        recipientName: 'User 2',
        emailType: 'daily_report_submission',
        subject: 'Subject B',
        sentTime: '2024-01-15T10:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'history-C',
        recipientId: 'user-3',
        recipientEmail: 'user3@example.com',
        recipientName: 'User 3',
        emailType: 'non_submission_prompt',
        subject: 'Subject C',
        sentTime: '2024-01-15T11:00:00Z',
        sendingStatus: 'success',
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
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: 'daily_report_submission',
      sendingStatus: 'success',
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
    expect(result.emailHistoryList.map((h) => h.recipientEmail)).toContain('user1@example.com');
    expect(result.emailHistoryList.map((h) => h.recipientEmail)).toContain('user2@example.com');
    expect(result.emailHistoryList.map((h) => h.recipientEmail)).toContain('user3@example.com');
  });
});
