import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-225: detectNonSubmittedReportersAtDeadline - Deadline Not Reached', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject execution when deadline has not been reached', async () => {
    // Mock judgeSchedulerExecutionTiming to return false (deadline not reached)
    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(false);

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T16:59:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      DeadlineNotReachedError
    );

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      '日報提出期限に達していないため、未提出者検知を実行できません。'
    );
  });
});
