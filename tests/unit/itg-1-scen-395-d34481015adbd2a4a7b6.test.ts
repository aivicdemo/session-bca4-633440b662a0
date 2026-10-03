jest.mock('../../src/logic/business-day-deadline-judgment');

import {
  getActiveReportersForSubmissionCheck,
  ActiveReporterInfo,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-395: 指定日付で有効な報告者が1件だけ存在する場合、その1件の報告者情報と総件数1を正常に返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success=true with exactly 1 active reporter and totalCount=1', async () => {
    // Setup: targetDate is a business day and prior to today
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // Mock isBusinessDay to return true
    (businessDayModule.isBusinessDay as jest.Mock).mockResolvedValue(true);

    // Execute
    const result = await getActiveReportersForSubmissionCheck(input);

    // Verify: success=true, reporters array has 1 element, totalCount=1
    expect(result.success).toBe(true);
    expect(result.reporters).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it('should return reporter with all required fields: reporterId, userId, reporterName, emailAddress, department, status', async () => {
    // Setup
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // Mock isBusinessDay to return true
    (businessDayModule.isBusinessDay as jest.Mock).mockResolvedValue(true);

    // Execute
    const result = await getActiveReportersForSubmissionCheck(input);

    // Verify: reporters[0] has all required fields as ActiveReporterInfo
    expect(result.reporters).toHaveLength(1);
    const reporter: ActiveReporterInfo = result.reporters[0];

    expect(reporter).toHaveProperty('reporterId');
    expect(reporter).toHaveProperty('userId');
    expect(reporter).toHaveProperty('reporterName');
    expect(reporter).toHaveProperty('emailAddress');
    expect(reporter).toHaveProperty('department');
    expect(reporter).toHaveProperty('status');

    // Verify field types
    expect(typeof reporter.reporterId).toBe('string');
    expect(typeof reporter.userId).toBe('string');
    expect(typeof reporter.reporterName).toBe('string');
    expect(typeof reporter.emailAddress).toBe('string');
    expect(typeof reporter.department).toBe('string');
    expect(typeof reporter.status).toBe('string');
  });

  it('should return complete GetActiveReportersForSubmissionCheckOutput structure', async () => {
    // Setup
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // Mock isBusinessDay to return true
    (businessDayModule.isBusinessDay as jest.Mock).mockResolvedValue(true);

    // Execute
    const result = await getActiveReportersForSubmissionCheck(input);

    // Verify: complete output structure with success message
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporters).toBeDefined();
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(result.totalCount).toBe(1);
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
  });
});
