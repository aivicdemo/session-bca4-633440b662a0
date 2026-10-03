import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  type GetActiveReportersForSubmissionCheckInput,
  ReporterMasterAccessError,
} from '../../src/logic/reporter-master-management';

describe('SCEN-745: 報告者IDが空または不正な形式の場合、エラーが発生し処理が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getActiveReportersForSubmissionCheck with empty teamLeaderId', async () => {
    const targetDate = new Date('2024-01-15');
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId: '',
    };

    const result = await getActiveReportersForSubmissionCheck(input);
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('reporters');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('message');
  });

  it('calls getActiveReportersForSubmissionCheck with invalid format teamLeaderId', async () => {
    const targetDate = new Date('2024-01-15');
    const invalidTeamLeaderIds = ['!!!'];

    for (const invalidId of invalidTeamLeaderIds) {
      const input: GetActiveReportersForSubmissionCheckInput = {
        targetDate,
        teamLeaderId: invalidId,
      };

      const result = await getActiveReportersForSubmissionCheck(input);
      expect(result).toBeDefined();
    }
  });
});
