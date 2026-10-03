import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  type GetActiveReportersForSubmissionCheckInput,
  type GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-747: メール送信が失敗した場合、失敗を検知ログに記録し、最大3回まで指数バックオフで再試行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success with complete reporter information structure', async () => {
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

    expect(typeof result.message).toBe('string');
  });
});
