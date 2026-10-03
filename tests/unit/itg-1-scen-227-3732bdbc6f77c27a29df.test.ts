import {
  detectNonSubmittedReportersAtDeadline,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

import * as reporterModule from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-227: detectNonSubmittedReportersAtDeadline - Submission Status Check Failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SubmissionStatusCheckFailureError when submission status check fails', async () => {
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
    (businessDayModule.judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return 3 reporters
    (reporterModule.getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue({
      reporters: activeReporters,
    });

    // Mock checkDailyReportExistsForDate to throw error
    (persistenceModule.checkDailyReportExistsForDate as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Mock retrieveNonSubmissionDetectionLogsByDate to return empty array
    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue({
      detectionLogs: [],
    });

    // Mock updateNonSubmissionDetectionLogWithReminderStatus to throw error
    (persistenceModule.updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock).mockRejectedValue(
      new Error('Log update failed')
    );

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:05:00Z',
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
