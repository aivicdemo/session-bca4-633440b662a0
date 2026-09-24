import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
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

describe('SCEN-228: 検知ログの記録処理が失敗した場合はエラーを返す', () => {
  const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<typeof judgeSchedulerExecutionTiming>;
  const mockGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<typeof getActiveReportersForSubmissionCheck>;
  const mockCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<typeof checkDailyReportExistsForDate>;
  const mockRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<typeof retrieveNonSubmissionDetectionLogsByDate>;
  const mockUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<typeof updateNonSubmissionDetectionLogWithReminderStatus>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログ記録処理が失敗した場合、DetectionLogRecordingFailureError をスローする', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    mockJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    mockGetActiveReportersForSubmissionCheck.mockResolvedValue([
      {
        userId: 'USER-001',
        userName: '太郎',
        emailAddress: 'user1@example.com',
        departmentId: 'DEPT-001',
      },
      {
        userId: 'USER-002',
        userName: '花子',
        emailAddress: 'user2@example.com',
        departmentId: 'DEPT-001',
      },
      {
        userId: 'USER-003',
        userName: '次郎',
        emailAddress: 'user3@example.com',
        departmentId: 'DEPT-002',
      },
      {
        userId: 'USER-004',
        userName: '美咲',
        emailAddress: 'user4@example.com',
        departmentId: 'DEPT-002',
      },
      {
        userId: 'USER-005',
        userName: '健太',
        emailAddress: 'user5@example.com',
        departmentId: 'DEPT-003',
      },
    ]);

    mockCheckDailyReportExistsForDate.mockImplementation(async (userId: string) => {
      return ['USER-001', 'USER-002', 'USER-003'].includes(userId);
    });

    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockUpdateNonSubmissionDetectionLogWithReminderStatus.mockRejectedValue(new Error('データベース接続エラー'));

    let thrownError: unknown;
    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(DetectionLogRecordingFailureError);
    expect((thrownError as Error).message).toBe('未提出者検知ログの記録に失敗しました。');
  });
});
