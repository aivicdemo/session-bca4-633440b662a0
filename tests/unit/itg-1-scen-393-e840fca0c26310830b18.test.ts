jest.mock('../../src/logic/business-day-deadline-judgment');

import {
  getActiveReportersForSubmissionCheck,
  NoActiveReportersError,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-393: 指定日付に有効な報告者が1件も存在しない場合、NoActiveReportersErrorを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error result when no active reporters exist on target date', async () => {
    // Setup: targetDate is a business day in the past
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // Mock isBusinessDay stub to return true
    (businessDayModule.isBusinessDay as jest.Mock).mockResolvedValue(true);

    // Execute
    try {
      const result = await getActiveReportersForSubmissionCheck(input);

      // Verify: If the result is returned (not thrown), check for error state
      expect(result.success).toBe(false);
      expect(result.message).toBe('指定日付に日報提出対象の有効な報告者が存在しません。');
      expect(result.reporters).toEqual([]);
      expect(result.totalCount).toBe(0);
    } catch (error) {
      // Alternative: error is thrown as NoActiveReportersError
      expect(error).toBeInstanceOf(NoActiveReportersError);
      expect((error as Error).message).toBe('指定日付に日報提出対象の有効な報告者が存在しません。');
    }
  });
});
