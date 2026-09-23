import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
  NoActiveReportersError,
  SubmissionStatusCheckFailureError,
  DetectionLogRecordingFailureError,
} from '../../src/logic/daily-report-non-submission-detection';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import {
  getActiveReportersForSubmissionCheck,
} from '../../src/logic/reporter-master-management';
import {
  checkDailyReportExistsForDate,
  retrieveNonSubmissionDetectionLogsByDate,
  updateNonSubmissionDetectionLogWithReminderStatus,
} from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

describe('SCEN-250: 全員が期限までに提出した場合は未提出者一覧が空になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全員が提出した場合、未提出者一覧は空になる', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue(true);

    (getActiveReportersForSubmissionCheck as jest.Mock).mockReturnValue([
      {
        userId: 'U001',
        userName: '報告者1',
        emailAddress: 'reporter1@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'U002',
        userName: '報告者2',
        emailAddress: 'reporter2@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'U003',
        userName: '報告者3',
        emailAddress: 'reporter3@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'U004',
        userName: '報告者4',
        emailAddress: 'reporter4@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'U005',
        userName: '報告者5',
        emailAddress: 'reporter5@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
    ]);

    (checkDailyReportExistsForDate as jest.Mock).mockReturnValue(true);

    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue([]);

    (updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock).mockReturnValue({
      detectionLogId: 'log-001',
      targetDate,
      detectionDateTime: currentDateTime,
      totalReportersCount: 5,
      nonSubmittedCount: 0,
      submittedCount: 5,
    });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(0);

    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(0);

    expect(result.detectionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
