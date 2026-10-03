import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  type GetActiveReportersForSubmissionCheckInput,
  type GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-742: 本日未提出の報告者が検知され、その報告者のみにリマインダーが送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success with reporters array and totalCount', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('reporters');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('message');
    expect(typeof result.success).toBe('boolean');
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.message).toBe('string');
  });
});
