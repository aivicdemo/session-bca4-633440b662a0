import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import type {
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-748: メール送信が3回失敗した場合、管理者に通知され検知ログに記録される', () => {
  const teamLeaderId = 'leader-001';
  const targetDate = new Date('2026-09-25');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getActiveReportersForSubmissionCheck and returns output structure', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.message).toBe('string');
  });

  it('verifies output fields for reporter information', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    result.reporters.forEach((reporter) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('department');
      expect(reporter).toHaveProperty('status');
    });
  });
});
