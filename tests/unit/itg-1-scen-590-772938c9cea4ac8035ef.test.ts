import { retrieveEmailSendingHistoryDetails, LeaderAuthorizationError } from '../../src/logic/daily-report-management-view';
import type { RetrieveEmailSendingHistoryDetailsInput } from '../../src/logic/daily-report-management-view';

describe('SCEN-590: リーダー権限がない、または対象チームの日報管理権限がない場合、LeaderAuthorizationError を発生させる', () => {
  it('should throw LeaderAuthorizationError when user does not have leader permission', async () => {
    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'non-leader-user-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(LeaderAuthorizationError);
    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      'You do not have permission to view email sending history for this team.'
    );
  });
});
