import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  UnauthorizedAccessError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-444: リーダー権限を持たないユーザーがアクセスした場合のエラー', () => {
  it('権限検証に失敗する場合、UnauthorizedAccessErrorが発生する', async () => {
    const input = {
      leaderId: 'non-leader-user-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(retrieveDailyReportsForLeaderReview(input)).rejects.toThrow(
      UnauthorizedAccessError
    );
    await expect(retrieveDailyReportsForLeaderReview(input)).rejects.toThrow(
      'この操作を実行する権限がありません。'
    );
  });
});
