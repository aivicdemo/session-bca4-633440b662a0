import {
  retrieveDailyReportsForLeaderReview,
  InvalidDateRangeError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-443: 開始日より後の終了日を指定した場合、InvalidDateRangeErrorが発生', () => {
  it('startDate が endDate より後の場合、InvalidDateRangeError がスローされ適切なエラーメッセージが返される', async () => {
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

    // InvalidDateRangeError がスローされることを確認
    try {
      await retrieveDailyReportsForLeaderReview(input);
      // 例外がスローされなければテスト失敗
      fail('InvalidDateRangeError がスローされることが期待されていますが、スローされませんでした。');
    } catch (error) {
      // エラーが InvalidDateRangeError であることを確認
      expect(error).toBeInstanceOf(InvalidDateRangeError);
      
      // エラーメッセージが期待値と一致することを確認
      expect((error as InvalidDateRangeError).message).toBe(
        '検索期間の開始日が終了日より後になっています。'
      );
    }
  });

  it('InvalidDateRangeError がスローされた場合、dailyReports, totalCount, pageNumber, pageSize, retrievedAt のいずれのフィールドも返却されない', async () => {
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

    try {
      const result = await retrieveDailyReportsForLeaderReview(input);
      // 返却されてはいけない
      fail('例外がスローされることが期待されています');
    } catch (error) {
      // スローされた例外は InvalidDateRangeError であり、結果は返却されない
      expect(error).toBeInstanceOf(InvalidDateRangeError);
      // エラーでスローされたため、呼び出し側に結果オブジェクトは渡されない
    }
  });
});
