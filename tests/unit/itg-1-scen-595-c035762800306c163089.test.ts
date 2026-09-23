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

describe('SCEN-595: 次ページが存在しない最終ページの場合、hasNextPageがfalseとなる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return hasNextPage as false when on last page', async () => {
    const mockEmailHistories = Array.from({ length: 95 }, (_, i) => ({
      historyId: `history-${i + 1}`,
      recipientId: `user-${i + 1}`,
      recipientEmail: `user${i + 1}@example.com`,
      recipientName: `User ${i + 1}`,
      emailType: 'daily_report_submission',
      subject: `Subject ${i + 1}`,
      sentTime: '2024-01-15T10:00:00Z',
      sendingStatus: 'success',
      errorMessage: null,
    }));

    (userMasterPersistence.retrieveEmailSendingHistoryByDateRange as any).mockResolvedValue(
      mockEmailHistories
    );

    const mockFormattedHistories: EmailHistoryDetail[] = mockEmailHistories.slice(90, 95).map((h) => ({
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
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 10,
      pageSize: 10,
    };

    const result = (await retrieveEmailSendingHistoryDetails(input)) as RetrieveEmailSendingHistoryDetailsOutput;

    expect(result.emailHistoryList.length).toBe(5);
    expect(result.totalCount).toBe(95);
    expect(result.pageNumber).toBe(10);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);
  });
});
