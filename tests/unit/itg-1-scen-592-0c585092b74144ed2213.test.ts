import { jest } from '@jest/globals';
import { retrieveEmailSendingHistoryDetails, NoEmailHistoryFoundError } from '../../src/logic/daily-report-management-view';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';
import type { RetrieveEmailSendingHistoryDetailsInput } from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof userMasterPersistence>('../../src/logic/user-master-persistence'),
  retrieveEmailSendingHistoryByDateRange: jest.fn()
}));

describe('SCEN-592: フィルター条件に合致するメール送信履歴が存在しない場合、NoEmailHistoryFoundError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoEmailHistoryFoundError when no matching email history exists', async () => {
    (userMasterPersistence.retrieveEmailSendingHistoryByDateRange as jest.Mock<any>).mockResolvedValue([]);

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
