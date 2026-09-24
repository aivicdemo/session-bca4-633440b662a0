jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-594: 次ページが存在する場合、hasNextPage がtrue となり、ページネーション情報が正確に返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('次ページが存在する場合、hasNextPageがtrueとなる', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const pageNumber = 1;
    const pageSize = 10;

    const mockHistoryRecords = Array.from({ length: 150 }, (_, i) => ({
      historyId: `EH-${String(i + 1).padStart(3, '0')}`,
      recipientId: `USER-${String((i % 5) + 1).padStart(3, '0')}`,
      recipientEmail: `user${(i % 5) + 1}@company.com`,
      emailType: 'daily_report_submission',
      sentTime: `2024-01-${String(Math.floor(i / 30) + 1).padStart(2, '0')}T09:30:00Z`,
      sendingStatus: 'success',
      errorMessage: null,
    }));

    (retrieveEmailSendingHistoryByDateRange as jest.Mock).mockResolvedValue(mockHistoryRecords);

    const result = await retrieveEmailSendingHistoryDetails({
      leaderId,
      startDate,
      endDate,
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber,
      pageSize,
    });

    expect(result.emailHistoryList).toHaveLength(10);
    expect(result.totalCount).toBe(150);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(true);
  });
});
