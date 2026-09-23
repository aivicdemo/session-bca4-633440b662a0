import { describe, it, expect } from '@jest/globals';
import {
  archivePastDailyReports,
  ArchivePastDailyReportsOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-451: 指定ユーザーの過去日報が1件だけ存在する場合', () => {
  it('アーカイブして件数1で返す', async () => {
    const input = {
      userId: 'user-001',
      archivedAt: '2024-01-15T09:00:00Z',
    };

    const result: ArchivePastDailyReportsOutput =
      await archivePastDailyReports(input);

    expect(result.userId).toBe('user-001');
    expect(result.archivedReportCount).toBe(1);
    expect(result.archivedAt).toBe('2024-01-15T09:00:00Z');
  });
});
