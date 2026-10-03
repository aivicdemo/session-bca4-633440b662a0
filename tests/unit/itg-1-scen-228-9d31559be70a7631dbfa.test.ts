import {
  detectNonSubmittedReportersAtDeadline,
  DetectionLogRecordingFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

import * as reporterModule from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-228: detectNonSubmittedReportersAtDeadline - Detection Log Recording Failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DetectionLogRecordingFailureError when log recording fails', async () => {
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
    (businessDayModule.judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return 5 reporters
    (reporterModule.getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue({
      reporters: activeReporters,
    });

    // Mock checkDailyReportExistsForDate: 3 submitted, 2 non-submitted
    (persistenceModule.checkDailyReportExistsForDate as jest.Mock).mockImplementation(
      async (input: { userId: string; reportDate: string }) => {
        const submittedIds = ['reporter-001', 'reporter-003', 'reporter-005'];
        return submittedIds.includes(input.userId);
      }
    );

    // Mock retrieveNonSubmissionDetectionLogsByDate to return empty array
    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue({
      detectionLogs: [],
    });

    // Mock updateNonSubmissionDetectionLogWithReminderStatus to throw error
    (persistenceModule.updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock).mockRejectedValue(
      new Error('Database connection error')
    );

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      DetectionLogRecordingFailureError
    );

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      '未提出者検知ログの記録に失敗しました。'
    );
  });
});
