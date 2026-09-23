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

describe('SCEN-251: 全員が期限までに提出しなかった場合は全員が未提出者として返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全員が未提出の場合、全員が未提出者として返される', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:30:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'TEAM-001';

    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue(true);

    (getActiveReportersForSubmissionCheck as jest.Mock).mockReturnValue([
      {
        userId: 'R001',
        userName: '報告者1',
        emailAddress: 'reporter1@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'R002',
        userName: '報告者2',
        emailAddress: 'reporter2@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'R003',
        userName: '報告者3',
        emailAddress: 'reporter3@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'R004',
        userName: '報告者4',
        emailAddress: 'reporter4@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'R005',
        userName: '報告者5',
        emailAddress: 'reporter5@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
    ]);

    (checkDailyReportExistsForDate as jest.Mock).mockReturnValue(false);

    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue([]);

    (updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock).mockReturnValue({
      detectionLogId: 'log-001',
      targetDate,
      detectionDateTime: currentDateTime,
      totalReportersCount: 5,
      nonSubmittedCount: 5,
      submittedCount: 0,
    });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(5);

    expect(result.nonSubmittedReporters.map(r => r.userId)).toEqual(['R001', 'R002', 'R003', 'R004', 'R005']);

    result.nonSubmittedReporters.forEach(reporter => {
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('userName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('departmentId');
    });

    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(5);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');

    expect(updateNonSubmissionDetectionLogWithReminderStatus).toHaveBeenCalled();
  });
});
