import {
  detectNonSubmittedReportersAtDeadline,
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

describe('SCEN-227: 日報提出状況の確認に失敗した場合は検知を中止する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checkDailyReportExistsForDateがエラーをスローした場合、SubmissionStatusCheckFailureErrorをスローする', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:05:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    // judgeSchedulerExecutionTiming: 提出期限に達したことを返す
    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue(true);

    // getActiveReportersForSubmissionCheck: 3名の有効な報告者を返す
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
    ]);

    // checkDailyReportExistsForDate: ネットワークタイムアウト等のエラーをスロー
    (checkDailyReportExistsForDate as jest.Mock).mockImplementation(() => {
      throw new Error('Database connection timeout');
    });

    // retrieveNonSubmissionDetectionLogsByDate: 空配列を返す
    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue([]);

    // updateNonSubmissionDetectionLogWithReminderStatus: 失敗を示すエラーをスロー
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
    ).rejects.toThrow(SubmissionStatusCheckFailureError);

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      });
    } catch (error) {
      if (error instanceof SubmissionStatusCheckFailureError) {
        expect(error.message).toContain('日報提出状況の確認に失敗しました。');
      }
    }
  });
});
