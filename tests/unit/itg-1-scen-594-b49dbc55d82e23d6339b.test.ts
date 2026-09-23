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

describe('SCEN-594: 次ページが存在する場合、hasNextPageがtrueとなり、ページネーション情報が正確に返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return hasNextPage as true when next page exists', async () => {
    const mockEmailHistories = Array.from({ length: 150 }, (_, i) => ({
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

    const mockFormattedHistories: EmailHistoryDetail[] = mockEmailHistories.slice(0, 10).map((h) => ({
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
      pageNumber: 1,
      pageSize: 10,
    };

    const result = (await retrieveEmailSendingHistoryDetails(input)) as RetrieveEmailSendingHistoryDetailsOutput;

    expect(result.emailHistoryList.length).toBe(10);
    expect(result.totalCount).toBe(150);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(true);
  });
});
