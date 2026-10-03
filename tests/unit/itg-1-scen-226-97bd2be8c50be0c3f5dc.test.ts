import {
  detectNonSubmittedReportersAtDeadline,
  NoActiveReportersError,
} from '../../src/logic/daily-report-non-submission-detection';

import * as reporterModule from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-226: detectNonSubmittedReportersAtDeadline - No Active Reporters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when no active reporters are available', async () => {
    // Mock judgeSchedulerExecutionTiming to return true (deadline reached)
    (businessDayModule.judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return empty list
    (reporterModule.getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue({
      reporters: [],
    });

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      NoActiveReportersError
    );

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      '検知対象の有効な報告者が存在しません。'
    );
  });
});
