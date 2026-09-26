jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  DataRetrievalError,
  RetrieveEmailSendingHistoryDetailsInput,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-593: データベース接続エラーまたはタイムアウトが発生した場合、DataRetrievalError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベース接続エラーが発生した場合、DataRetrievalErrorが発生する', async () => {
    (retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>).mockRejectedValue(
      new Error('Database connection failed')
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

    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      DataRetrievalError
    );
    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      'Failed to retrieve email sending history due to a system error.'
    );
  });

  it('タイムアウトが発生した場合、DataRetrievalErrorが発生する', async () => {
    (retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>).mockRejectedValue(
      new Error('Network timeout')
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

    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      DataRetrievalError
    );
    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      'Failed to retrieve email sending history due to a system error.'
    );
  });
});
