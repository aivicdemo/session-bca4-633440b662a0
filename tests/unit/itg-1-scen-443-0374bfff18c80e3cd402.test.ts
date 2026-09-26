import { retrieveDailyReportsForLeaderReview, InvalidDateRangeError } from '../../src/logic/daily-report-persistence';

describe('SCEN-443: リーダーが開始日より後の終了日を指定した場合、InvalidDateRangeErrorが発生し文言「検索期間の開始日が終了日より後になっています。」が返される', () => {
  it('開始日が終了日より後の場合、InvalidDateRangeErrorが発生する', () => {
    const leaderId = 'leader001';
    const startDate = '2024-01-31';
    const endDate = '2024-01-01';

    const callFunction = () => {
      retrieveDailyReportsForLeaderReview({
        leaderId,
        startDate,
        endDate,
        filterByUserId: undefined,
        filterBySubmissionStatus: undefined,
        sortBy: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      });
    };

    // InvalidDateRangeError 例外がスローされることを確認
    expect(callFunction).toThrow(InvalidDateRangeError);

    // エラーメッセージが「検索期間の開始日が終了日より後になっています。」であることを確認
    expect(callFunction).toThrow('検索期間の開始日が終了日より後になっています。');
  });
});
