import { describe, it, expect, jest } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  LeaderAuthorizationError,
  RetrieveEmailSendingHistoryDetailsInput,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-590: リーダー権限がない、または対象チームの日報管理権限がない場合、LeaderAuthorizationErrorを発生させる', () => {
  it('should throw LeaderAuthorizationError when user lacks leader permission', async () => {
    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'user-without-permission',
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
