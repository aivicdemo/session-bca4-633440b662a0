import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  type GetActiveReportersForSubmissionCheckInput,
  type GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-743: 本日既に提出済みの報告者は検知対象から除外される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns output with required properties', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);

    result.reporters.forEach((reporter) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('department');
      expect(reporter).toHaveProperty('status');
    });

    expect(result.totalCount).toBe(result.reporters.length);
    expect(result.message).toBeTruthy();
  });
});
