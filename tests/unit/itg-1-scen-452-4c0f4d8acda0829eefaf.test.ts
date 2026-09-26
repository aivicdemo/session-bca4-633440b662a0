import { describe, it, expect } from '@jest/globals';
import { archivePastDailyReports, type ArchivePastDailyReportsOutput } from '../../src/logic/daily-report-persistence';

describe('SCEN-452: archivePastDailyReports - ISO 8601 datetime passthrough', () => {
  it('should include the exact archivedAt timestamp in output', async () => {
    const isoTimestamp = '2024-01-15T09:30:00Z';
    const input = {
      userId: 'user-valid',
      archivedAt: isoTimestamp,
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.archivedAt).toBe(isoTimestamp);
    expect(result.userId).toBe('user-valid');
    expect(result.archivedReportCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.archivedReportCount).toBe('number');
  });
});
