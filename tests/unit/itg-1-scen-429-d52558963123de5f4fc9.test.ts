import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidReportDateError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-429: 集計対象日が未来日の場合にエラーが発生する', () => {
  test('reportDate が未来日の場合、InvalidReportDateError が発生する', () => {
    // 本日が 2024-01-15 であると仮定し、reportDate に '2024-01-16' を設定
    const input: SaveDailyReportInput = {
      userId: 'user001',
      reportDate: '2024-01-16',
      content: '本日の業務内容',
    };

    // saveDailyReport 関数を呼び出す
    expect(() => {
      saveDailyReport(input);
    }).toThrow(InvalidReportDateError);

    // エラー文言として「集計対象日は本日以前の日付を指定してください」が返される
    expect(() => {
      saveDailyReport(input);
    }).toThrow('集計対象日は本日以前の日付を指定してください');
  });
});
