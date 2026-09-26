import {
  detectNonSubmittedReportersAtDeadline,
  NoActiveReportersError,
} from '../../src/logic/daily-report-non-submission-detection';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-226: detectNonSubmittedReportersAtDeadline - No Active Reporters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when no active reporters are available', async () => {
    // Mock judgeSchedulerExecutionTiming to return true (deadline reached)
    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return empty array
    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue([]);

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
