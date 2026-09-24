jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  NoEmailHistoryFoundError,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-592: フィルター条件に合致するメール送信履歴が存在しない場合、NoEmailHistoryFoundError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィルター条件に合致するメール送信履歴が存在しない場合、NoEmailHistoryFoundErrorが発生する', async () => {
    (retrieveEmailSendingHistoryByDateRange as jest.Mock).mockResolvedValue([]);

    const input = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: 'daily_report_submission',
      sendingStatus: 'success',
      recipientEmail: 'user@example.com',
      pageNumber: 1,
      pageSize: 10,
    };

    try {
      await retrieveEmailSendingHistoryDetails(input);
      throw new Error('NoEmailHistoryFoundErrorが発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof NoEmailHistoryFoundError)) {
        throw error;
      }
      expect(error.message).toBe('No email sending history found for the specified criteria.');
    }
  });
});
