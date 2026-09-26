import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import {
  checkDailyReportExistsForDate,
  retrieveNonSubmissionDetectionLogsByDate,
} from '../../src/logic/daily-report-persistence';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-234: detectNonSubmittedReportersAtDeadline - Deadline Time Format Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should identify invalid deadline time formats and handle appropriately', async () => {
    const activeReporters = [
      {
        userId: 'reporter-001',
        userName: 'Reporter One',
        emailAddress: 'reporter1@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-002',
        userName: 'Reporter Two',
        emailAddress: 'reporter2@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-003',
        userName: 'Reporter Three',
        emailAddress: 'reporter3@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-004',
        userName: 'Reporter Four',
        emailAddress: 'reporter4@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-005',
        userName: 'Reporter Five',
        emailAddress: 'reporter5@example.com',
        departmentId: 'dept-001',
      },
    ];

    // Mock judgeSchedulerExecutionTiming to return true
    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return 5 reporters
    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue(activeReporters);

    // Mock checkDailyReportExistsForDate
    (checkDailyReportExistsForDate as jest.Mock).mockImplementation(() => true);

    // Mock retrieveNonSubmissionDetectionLogsByDate to return empty array
    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue([]);

    // Test various invalid formats
    const invalidFormats = ['25:00', 'ab:cd', '17', '17:00:00', ''];

    for (const invalidFormat of invalidFormats) {
      const input = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:00:00Z',
        submissionDeadlineTime: invalidFormat,
        teamId: 'team-001',
      };

      // Should throw either DeadlineNotReachedError or SubmissionStatusCheckFailureError
      try {
        await detectNonSubmittedReportersAtDeadline(input);
        fail(`Should have thrown an error for invalid format: ${invalidFormat}`);
      } catch (error) {
        const errorName = (error as any).constructor.name;
        expect(['DeadlineNotReachedError', 'SubmissionStatusCheckFailureError']).toContain(errorName);
      }
    }
  });
});
