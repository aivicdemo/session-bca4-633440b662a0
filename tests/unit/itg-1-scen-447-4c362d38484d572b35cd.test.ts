import { describe, it, expect } from '@jest/globals';
import {
  archivePastDailyReports,
  ArchivePastDailyReportsOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-447: 指定ユーザーの過去日報が複数件存在する場合', () => {
  it('すべてアーカイブ状態に遷移し件数と完了日時を返す', async () => {
    const input = {
      userId: 'user-001',
      archivedAt: '2024-01-15T10:30:00Z',
    };

    const result: ArchivePastDailyReportsOutput =
      await archivePastDailyReports(input);

    expect(result.userId).toBe('user-001');
    expect(result.archivedReportCount).toBe(3);
    expect(result.archivedAt).toBe('2024-01-15T10:30:00Z');
  });
});
