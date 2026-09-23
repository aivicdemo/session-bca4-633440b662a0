import { describe, it, expect } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-446: 検索対象期間内に提出済み日報が存在しない場合', () => {
  it('空の日報配列とtotalCountが0で返される', async () => {
    const input = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: RetrieveDailyReportsForLeaderReviewOutput =
      await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});
