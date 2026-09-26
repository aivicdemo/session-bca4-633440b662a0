import {
  detectNonSubmittedReportersAtDeadline,
  InvalidReporterDataError,
} from '../../src/logic/daily-report-non-submission-detection';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-229: detectNonSubmittedReportersAtDeadline - Invalid Reporter ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when reporter ID is empty or invalid', async () => {
    // Setup with empty reporter ID in the list
    const activeReporters = [
      {
        userId: 'reporter-001',
        userName: 'Reporter One',
        emailAddress: 'reporter1@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: '', // Empty reporter ID
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

    // Mock getActiveReportersForSubmissionCheck to return reporters with empty ID
    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue(activeReporters);

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-A',
    };

    // Should throw an error for invalid reporter ID format
    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow();
  });
});
