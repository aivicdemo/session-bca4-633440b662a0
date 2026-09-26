import { describe, it, expect } from '@jest/globals';
import { archivePastDailyReports, type ArchivePastDailyReportsOutput } from '../../src/logic/daily-report-persistence';

describe('SCEN-451: archivePastDailyReports - Edge case: single report archive', () => {
  it('should archive and return count 1 when exactly one unarchived report exists', async () => {
    const input = {
      userId: 'user-001',
      archivedAt: '2024-01-15T09:00:00Z',
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.userId).toBe('user-001');
    expect(result.archivedReportCount).toBe(1);
    expect(result.archivedAt).toBe('2024-01-15T09:00:00Z');
  });
});
