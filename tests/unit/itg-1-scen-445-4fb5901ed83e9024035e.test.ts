import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence');

import {
  retrieveDailyReportsForLeaderReview,
  DatabaseConnectionError,
  RetrieveDailyReportsForLeaderReviewInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-445: 日報データベースへの接続に失敗した場合、DatabaseConnectionErrorが発生', () => {
  it('DatabaseConnectionErrorが発生し、エラー文言「日報データの取得に失敗しました。」が返される', async () => {
    const error = new DatabaseConnectionError('日報データの取得に失敗しました。');
    (retrieveDailyReportsForLeaderReview as jest.Mock).mockRejectedValueOnce(error);

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      filterBySubmissionStatus: 'submitted',
    };

    try {
      await retrieveDailyReportsForLeaderReview(input);
      fail('DatabaseConnectionErrorが発生するはずです');
    } catch (caughtError) {
      expect(caughtError).toBeInstanceOf(DatabaseConnectionError);
      expect((caughtError as any).message).toBe('日報データの取得に失敗しました。');
    }
  });
});
