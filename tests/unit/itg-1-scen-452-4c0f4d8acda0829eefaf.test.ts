import { archivePastDailyReports, ArchivePastDailyReportsInput, ArchivePastDailyReportsOutput } from '../../src/logic/daily-report-persistence';

describe('SCEN-452: archivePastDailyReports - ISO 8601形式の有効な日時を出力に含める', () => {
  it('入力の archivedAt が ISO 8601形式の有効な日時のとき、その日時を出力に含めて返す', async () => {
    // 入力パラメータの準備
    const validUserId = 'user-123';
    const validArchivedAt = '2024-01-15T09:30:00Z';

    const input: ArchivePastDailyReportsInput = {
      userId: validUserId,
      archivedAt: validArchivedAt,
    };

    // テスト対象の関数を呼び出す
    const output: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    // 出力型が返されたことを確認
    expect(output).toBeDefined();

    // archivedAt フィールドが入力時の値をそのまま含んでいることを確認
    expect(output.archivedAt).toBe(validArchivedAt);

    // userId フィールドが入力時のユーザーIDと一致することを確認
    expect(output.userId).toBe(validUserId);

    // archivedReportCount フィールドが 0 以上の整数値であることを確認
    expect(output.archivedReportCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(output.archivedReportCount)).toBe(true);
  });
});
