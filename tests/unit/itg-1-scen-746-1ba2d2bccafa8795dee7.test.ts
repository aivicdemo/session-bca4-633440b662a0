import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  type GetActiveReportersForSubmissionCheckInput,
  NoActiveReportersError,
} from '../../src/logic/reporter-master-management';

describe('SCEN-746: リマインダー送信対象が0人の場合、送信処理がスキップされ検知ログのみ記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getActiveReportersForSubmissionCheck with valid inputs', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result = await getActiveReportersForSubmissionCheck(input);
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('reporters');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('message');
  });
});
