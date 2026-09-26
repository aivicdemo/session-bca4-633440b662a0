import {
  detectNonSubmittedReportersAtDeadline,
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

describe('SCEN-231: detectNonSubmittedReportersAtDeadline - Database Temporarily Unavailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SubmissionStatusCheckFailureError when database is temporarily unavailable', async () => {
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
    ];

    // Mock judgeSchedulerExecutionTiming to return true
    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return reporters
    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue(activeReporters);

    // Mock checkDailyReportExistsForDate to throw connection error
    (checkDailyReportExistsForDate as jest.Mock).mockRejectedValue(
      new Error('Connection timeout')
    );

    // Mock retrieveNonSubmissionDetectionLogsByDate to return empty array
    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue([]);

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      SubmissionStatusCheckFailureError
    );

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      '日報提出状況の確認に失敗しました。'
    );
  });
});
