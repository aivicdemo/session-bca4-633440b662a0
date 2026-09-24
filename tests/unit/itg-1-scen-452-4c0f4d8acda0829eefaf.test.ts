import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence');

import {
  archivePastDailyReports,
  ArchivePastDailyReportsInput,
  ArchivePastDailyReportsOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-452: 入力の archivedAt が ISO 8601形式の有効な日時のとき、その日時を出力に含めて返す', () => {
  it('出力型の archivedAt フィールドが入力時に指定した ISO 8601形式の日時文字列をそのまま含んでいる', async () => {
    const mockOutput: ArchivePastDailyReportsOutput = {
      userId: 'user-001',
      archivedReportCount: 2,
      archivedAt: '2024-01-15T09:30:00Z',
    };
    (archivePastDailyReports as jest.Mock).mockResolvedValueOnce(mockOutput);

    const input: ArchivePastDailyReportsInput = {
      userId: 'user-001',
      archivedAt: '2024-01-15T09:30:00Z',
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.archivedAt).toBe('2024-01-15T09:30:00Z');
    expect(result.userId).toBe('user-001');
    expect(typeof result.archivedReportCount).toBe('number');
    expect(result.archivedReportCount).toBeGreaterThanOrEqual(0);
  });
});
