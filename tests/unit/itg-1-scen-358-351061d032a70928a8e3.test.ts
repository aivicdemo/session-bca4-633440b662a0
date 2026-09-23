import { registerReporter } from '../../src/logic/reporter-master-management';

describe('SCEN-358: 更新で情報が置き換えられた場合', () => {
  it('should successfully register/update reporter and return sync information', async () => {
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');

    const result = await registerReporter({
      userId: 'REP-001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: executionTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP-001');
    expect(result.changeHistoryId).toBe('CH-001');
    expect(result.message).not.toBeNull();

    if (result.syncTimestamp) {
      const syncTimestamp = new Date(result.syncTimestamp);
      expect(syncTimestamp.getTime()).toBeGreaterThanOrEqual(executionTimestamp.getTime());
    }

    if (result.nextReportingTargets) {
      expect(result.nextReportingTargets).toContain('REP-001');
    }
  });
});
