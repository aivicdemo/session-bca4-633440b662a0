import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  NoEmailHistoryFoundError,
  RetrieveEmailSendingHistoryDetailsInput,
} from '../../src/logic/daily-report-management-view';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-592: フィルター条件に合致するメール送信履歴が存在しない場合、NoEmailHistoryFoundErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoEmailHistoryFoundError when no email history matches the filter criteria', async () => {
    (userMasterPersistence.retrieveEmailSendingHistoryByDateRange as any).mockResolvedValue([]);

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

    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(NoEmailHistoryFoundError);
    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      'No email sending history found for the specified criteria.'
    );
  });
});
