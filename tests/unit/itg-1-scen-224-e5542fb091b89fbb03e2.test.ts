import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
  NoActiveReportersError,
  SubmissionStatusCheckFailureError,
  DetectionLogRecordingFailureError,
  InvalidReporterDataError,
  type DetectNonSubmittedReportersAtDeadlineOutput,
} from '../../src/logic/daily-report-non-submission-detection';

import * as reporterModule from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-224: detectNonSubmittedReportersAtDeadline - Normal Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly identify submitted and non-submitted reporters and return detection results', async () => {
    // Test setup: 5 reporters, 3 submitted, 2 non-submitted
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

    // Mock judgeSchedulerExecutionTiming to return true (deadline reached)
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

    // Mock retrieveNonSubmissionDetectionLogsByDate to return no existing logs
    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue({
      detectionLogs: [],
    });

    // Mock updateNonSubmissionDetectionLogWithReminderStatus to succeed
    (persistenceModule.updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock).mockResolvedValue({
      isSuccessful: true,
    });

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:05:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'TEAM-001',
    };

    const result = await detectNonSubmittedReportersAtDeadline(input);

    // Verify the output
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0].userId).toBe('reporter-002');
    expect(result.nonSubmittedReporters[1].userId).toBe('reporter-004');

    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:05:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:05:00Z');
  });
});
