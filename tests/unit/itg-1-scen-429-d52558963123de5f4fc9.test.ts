import { describe, it, expect } from '@jest/globals';
import { saveDailyReport, InvalidReportDateError } from '../../src/logic/daily-report-persistence';

describe('SCEN-429: 集計対象日が未来日の場合にエラーが発生する', () => {
  it('reportDate が未来日の場合、InvalidReportDateError が発生する', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowString = tomorrowDate.toISOString().split('T')[0];

    const input = {
      userId: 'user001',
      reportDate: tomorrowString,
      businessContent: '本日の業務内容',
      submittedAt: tomorrowString + 'T17:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    await expect(saveDailyReport(input)).rejects.toThrow('集計対象日は本日以前の日付を指定してください');
  });
});
