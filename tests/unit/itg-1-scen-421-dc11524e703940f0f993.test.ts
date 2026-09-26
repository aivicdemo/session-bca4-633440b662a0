import { describe, it, expect } from '@jest/globals';
import { saveDailyReport, InvalidReportDateError } from '../../src/logic/daily-report-persistence';

describe('SCEN-421: 営業日でない報告日で日報保存を試みるとInvalidReportDateErrorが発生する', () => {
  it('should throw InvalidReportDateError when reporting date is not a business day', async () => {
    const input = {
      userId: 'user001',
      reportDate: '2025-01-11',
      businessContent: '営業活動実施',
      submittedAt: '2025-01-11T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    await expect(saveDailyReport(input)).rejects.toThrow('報告日は営業日である必要があります。');
  });
});
