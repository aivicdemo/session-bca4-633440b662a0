import {
  saveDailyReport,
  SaveDailyReportInput,
  SaveDailyReportOutput,
  InvalidUserIdError,
  InvalidReportDateError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-419: 有効なユーザーID・営業日・業務内容で日報を保存すると日報IDと保存タイムスタンプが返される', () => {
  it('有効なユーザーID・営業日・業務内容で日報を保存すると日報IDと保存タイムスタンプが返される', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '顧客A社との打ち合わせを実施',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    const result: SaveDailyReportOutput = await saveDailyReport(input);

    expect(result).toBeDefined();
    expect(result.dailyReportId).toBeDefined();
    expect(typeof result.dailyReportId).toBe('string');
    expect(result.dailyReportId.length).toBeGreaterThan(0);

    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate).toBeInstanceOf(Date);
    expect(!isNaN(savedAtDate.getTime())).toBe(true);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(result.userId).toBe('user-001');
    expect(result.reportDate).toBe('2024-01-15');
  });
});
