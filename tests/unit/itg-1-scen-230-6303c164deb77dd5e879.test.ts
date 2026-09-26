import {
  detectNonSubmittedReportersAtDeadline,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-230: detectNonSubmittedReportersAtDeadline - Missing Deadline Time', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when submission deadline time is not set', async () => {
    // Mock judgeSchedulerExecutionTiming to return true
    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    const input1 = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: null as any, // null value
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input1)).rejects.toThrow(
      SubmissionStatusCheckFailureError
    );

    const input2 = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '', // empty string
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input2)).rejects.toThrow(
      SubmissionStatusCheckFailureError
    );
  });
});
