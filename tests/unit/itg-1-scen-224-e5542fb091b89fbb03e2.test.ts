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

jest.mock('../../../src/logic/business-day-deadline-judgment');
jest.mock('../../../src/logic/reporter-master-management');
jest.mock('../../../src/logic/daily-report-persistence');

describe('SCEN-224: 提出期限到達時点で、提出済みと未提出の報告者を正しく識別して未提出者一覧を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出期限に達し、報告者5名のうち3名が提出済み、2名が未提出の場合、未提出者2名の一覧を返す', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:05:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'TEAM-001';

    // judgeSchedulerExecutionTiming: 提出期限に達していることを返す
    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue(true);

    // getActiveReportersForSubmissionCheck: 5名の有効な報告者を返す
    (getActiveReportersForSubmissionCheck as jest.Mock).mockReturnValue([
      {
        userId: 'user-001',
        userName: '報告者1',
        emailAddress: 'reporter1@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'user-002',
        userName: '報告者2',
        emailAddress: 'reporter2@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'user-003',
        userName: '報告者3',
        emailAddress: 'reporter3@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'user-004',
        userName: '報告者4',
        emailAddress: 'reporter4@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
      {
        userId: 'user-005',
        userName: '報告者5',
        emailAddress: 'reporter5@example.com',
        departmentId: 'dept-001',
        isActive: true,
      },
    ]);

    // checkDailyReportExistsForDate: 3名が提出済み、2名が未提出を返す
    (checkDailyReportExistsForDate as jest.Mock).mockImplementation((userId: string) => {
      return ['user-001', 'user-002', 'user-003'].includes(userId);
    });

    // retrieveNonSubmissionDetectionLogsByDate: 既存ログなし
    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue([]);

    // updateNonSubmissionDetectionLogWithReminderStatus: 成功
    (updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock).mockReturnValue({
      detectionLogId: 'log-001',
      targetDate,
      detectionDateTime: currentDateTime,
      totalReportersCount: 5,
      nonSubmittedCount: 2,
      submittedCount: 3,
    });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    // 未提出者は user-004, user-005 の2名
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0].userId).toBe('user-004');
    expect(result.nonSubmittedReporters[0].userName).toBe('報告者4');
    expect(result.nonSubmittedReporters[0].emailAddress).toBe('reporter4@example.com');
    expect(result.nonSubmittedReporters[1].userId).toBe('user-005');
    expect(result.nonSubmittedReporters[1].userName).toBe('報告者5');
    expect(result.nonSubmittedReporters[1].emailAddress).toBe('reporter5@example.com');

    // detectionLog の検証
    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.detectionDateTime).toBe(currentDateTime);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    // detectionTimestamp の検証
    expect(result.detectionTimestamp).toBe(currentDateTime);
  });
});
