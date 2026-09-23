import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-739: 営業日の定時にスケジューラが実行され、アクティブな報告者へリマインダーが送信される', () => {
  let targetDate: string;
  let teamLeaderId: string;

  beforeEach(() => {
    targetDate = new Date().toISOString().split('T')[0];
    teamLeaderId = 'TL001';
  });

  it('should return success true with 1-5 active reporters for valid business day', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay').mockReturnValue(true);

    const result: GetActiveReportersForSubmissionCheckOutput = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(result.reporters.length).toBeGreaterThanOrEqual(1);
    expect(result.reporters.length).toBeLessThanOrEqual(5);

    result.reporters.forEach((reporter: any) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('email');
      expect(reporter).toHaveProperty('teamId');
      expect(reporter).toHaveProperty('status');
    });

    expect(result.totalCount).toBe(result.reporters.length);
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });
});
