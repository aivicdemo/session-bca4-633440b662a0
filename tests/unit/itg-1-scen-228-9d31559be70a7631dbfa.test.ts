import {
  detectNonSubmittedReportersAtDeadline,
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

describe('SCEN-228: 検知ログの記録処理が失敗した場合はエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updateNonSubmissionDetectionLogWithReminderStatusが失敗した場合、DetectionLogRecordingFailureErrorをスローする', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    // judgeSchedulerExecutionTiming: 提出期限に達したことを返す
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

    // retrieveNonSubmissionDetectionLogsByDate: 空の既存ログを返す
    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue([]);

    // updateNonSubmissionDetectionLogWithReminderStatus: ログ記録処理が失敗
    (updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock).mockImplementation(() => {
      throw new Error('Database connection error');
    });

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      })
    ).rejects.toThrow(DetectionLogRecordingFailureError);

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      });
    } catch (error) {
      if (error instanceof DetectionLogRecordingFailureError) {
        expect(error.message).toBe('未提出者検知ログの記録に失敗しました。');
      }
    }
  });
});
