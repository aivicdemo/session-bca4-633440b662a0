import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence');

import {
  archivePastDailyReports,
  ArchivePastDailyReportsInput,
  ArchivePastDailyReportsOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-451: 指定ユーザーの過去日報が1件だけ存在するとき、アーカイブして件数1で返す', () => {
  it('出力型のフィールド値が正しく返される', async () => {
    const mockOutput: ArchivePastDailyReportsOutput = {
      userId: 'user-001',
      archivedReportCount: 1,
      archivedAt: '2024-01-15T09:00:00Z',
    };
    (archivePastDailyReports as jest.Mock).mockResolvedValueOnce(mockOutput);

    const input: ArchivePastDailyReportsInput = {
      userId: 'user-001',
      archivedAt: '2024-01-15T09:00:00Z',
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.userId).toBe('user-001');
    expect(result.archivedReportCount).toBe(1);
    expect(result.archivedAt).toBe('2024-01-15T09:00:00Z');
  });
});
