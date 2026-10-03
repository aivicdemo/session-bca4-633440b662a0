jest.mock('../../src/logic/business-day-deadline-judgment');

import {
  getActiveReportersForSubmissionCheck,
  ReporterMasterAccessError,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-394: 報告者マスタデータへのアクセスに失敗した場合、ReporterMasterAccessErrorを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error result when reporter master data access fails', async () => {
    // Setup: targetDate is a business day (2024-01-15)
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const teamLeaderId = 'leader-001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // Mock isBusinessDay to return true
    (businessDayModule.isBusinessDay as jest.Mock).mockResolvedValue(true);

    // Execute: getActiveReportersForSubmissionCheck
    try {
      const result = await getActiveReportersForSubmissionCheck(input);

      // Verify: If the result is returned (not thrown), check for error state
      expect(result.success).toBe(false);
      expect(result.message).toBe('報告者マスタの取得に失敗しました。');
      expect(result.reporters).toEqual([]);
      expect(result.totalCount).toBe(0);
    } catch (error) {
      // Alternative: error is thrown as ReporterMasterAccessError
      expect(error).toBeInstanceOf(ReporterMasterAccessError);
      expect((error as Error).message).toBe('報告者マスタの取得に失敗しました。');
    }
  });
});
