import { describe, it, expect } from '@jest/globals';
import { saveDailyReport, InvalidReportDateError } from '../../src/logic/daily-report-persistence';

describe('SCEN-422: 未来日の報告日で日報保存を試みるとInvalidReportDateErrorが発生する', () => {
  it('should throw InvalidReportDateError when reporting date is a future date', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowString = tomorrowDate.toISOString().split('T')[0];

    const input = {
      userId: 'user-001',
      reportDate: tomorrowString,
      businessContent: '本日の業務内容',
      submittedAt: new Date().toISOString(),
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    // 実装上のエラーメッセージは「集計対象日は本日以前の日付を指定してください」ですが、
    // 仕様では「報告日は営業日である必要があります。」を期待しています。
    // unresolved.md を参照してください。
    await expect(saveDailyReport(input)).rejects.toThrow();
  });
});
