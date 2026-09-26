import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  LeaderAuthorizationError,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-590: リーダー権限がない、または対象チームの日報管理権限がない場合、LeaderAuthorizationError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダー権限を持たないユーザーIDを指定するとLeaderAuthorizationErrorが発生し、エラーメッセージが「You do not have permission to view email sending history for this team.」である', async () => {
    const input = {
      leaderId: 'non-leader-user-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    try {
      await retrieveEmailSendingHistoryDetails(input);
      fail('Expected LeaderAuthorizationError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderAuthorizationError);
      expect((error as Error).message).toBe(
        'You do not have permission to view email sending history for this team.'
      );
    }
  });
});
