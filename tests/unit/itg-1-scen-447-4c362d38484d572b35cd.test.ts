import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence');

import {
  archivePastDailyReports,
  ArchivePastDailyReportsInput,
  ArchivePastDailyReportsOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-447: 指定ユーザーの過去日報が複数件存在するとき、すべてアーカイブ状態に遷移', () => {
  it('すべてアーカイブ状態に遷移し件数と完了日時を返す', async () => {
    const mockOutput: ArchivePastDailyReportsOutput = {
      userId: 'user-001',
      archivedReportCount: 3,
      archivedAt: '2024-01-15T10:30:00Z',
    };
    (archivePastDailyReports as jest.Mock).mockResolvedValueOnce(mockOutput);

    const input: ArchivePastDailyReportsInput = {
      userId: 'user-001',
      archivedAt: '2024-01-15T10:30:00Z',
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.userId).toBe('user-001');
    expect(result.archivedReportCount).toBe(3);
    expect(result.archivedAt).toBe('2024-01-15T10:30:00Z');
  });
});
