import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  DataRetrievalError,
  RetrieveEmailSendingHistoryDetailsInput,
} from '../../src/logic/daily-report-management-view';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-593: データベース接続エラーまたはタイムアウトが発生した場合、DataRetrievalErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalError when database connection fails', async () => {
    (userMasterPersistence.retrieveEmailSendingHistoryByDateRange as any).mockRejectedValue(
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

    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(DataRetrievalError);
    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      'Failed to retrieve email sending history due to a system error.'
    );
  });
});
