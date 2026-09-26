jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  NoEmailHistoryFoundError,
  RetrieveEmailSendingHistoryDetailsInput,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-592: フィルター条件に合致するメール送信履歴が存在しない場合、NoEmailHistoryFoundError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィルター条件に合致するメール送信履歴が存在しない場合、NoEmailHistoryFoundErrorが発生する', async () => {
    (retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      emailSendingHistories: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
    });

    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: 'daily_report_submission',
      sendingStatus: 'success',
      recipientEmail: 'user@example.com',
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      NoEmailHistoryFoundError
    );
    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      'No email sending history found for the specified criteria.'
    );
  });
});
