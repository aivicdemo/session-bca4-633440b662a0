import { describe, it, expect } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  InvalidDateRangeError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-443: リーダーが開始日より後の終了日を指定した場合のエラー', () => {
  it('startDateが endDateより後の場合、InvalidDateRangeErrorが発生する', async () => {
    const input = {
      leaderId: 'leader001',
      startDate: '2024-01-31',
      endDate: '2024-01-01',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(retrieveDailyReportsForLeaderReview(input)).rejects.toThrow(
      InvalidDateRangeError
    );
    await expect(retrieveDailyReportsForLeaderReview(input)).rejects.toThrow(
      '検索期間の開始日が終了日より後になっています。'
    );
  });
});
