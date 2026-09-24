import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  SaveDailyReportOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-419: 有効なユーザーID・営業日・業務内容で日報を保存すると日報IDと保存タイムスタンプが返される', () => {
  test('should return dailyReportId and savedAt when saving with valid inputs', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '顧客A社との打ち合わせを実施',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    const output: SaveDailyReportOutput = await saveDailyReport(input);

    expect(output).toBeDefined();
    expect(output.dailyReportId).toBeDefined();
    expect(typeof output.dailyReportId).toBe('string');
    expect(output.dailyReportId.length).toBeGreaterThan(0);

    expect(output.savedAt).toBeDefined();
    expect(typeof output.savedAt).toBe('string');
    expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(output.userId).toBe('user-001');
    expect(output.reportDate).toBe('2024-01-15');
  });
});
