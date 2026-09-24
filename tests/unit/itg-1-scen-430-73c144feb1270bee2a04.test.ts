import {
  saveDailyReport,
  SaveDailyReportInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-430: チームメンバーIDリストが空の場合にエラーが発生する', () => {
  test('teamMemberIds が空配列の場合、エラーメッセージ「チームメンバーが登録されていません」でスロー', () => {
    // aggregateDailyReportStatus を実行、teamMemberIds に空配列 [] を指定
    const input: SaveDailyReportInput = {
      userId: 'user001',
      reportDate: '2024-01-15',
      content: '本日の業務内容',
      teamMemberIds: [],
      submittedReports: [],
    };

    // 関数の実行を開始し、エラーをスロー
    expect(() => {
      saveDailyReport(input);
    }).toThrow('チームメンバーが登録されていません');
  });
});
