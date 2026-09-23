import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  DatabaseConnectionError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-445: データベース接続失敗時のエラー', () => {
  it('データベース接続に失敗する場合、DatabaseConnectionErrorが発生する', async () => {
    const input = {
      leaderId: 'leader-001',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(retrieveDailyReportsForLeaderReview(input)).rejects.toThrow(
      DatabaseConnectionError
    );
    await expect(retrieveDailyReportsForLeaderReview(input)).rejects.toThrow(
      '日報データの取得に失敗しました。'
    );
  });
});
