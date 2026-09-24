import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
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

describe('SCEN-227: 日報提出状況の確認に失敗した場合は検知を中止する', () => {
  const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<typeof judgeSchedulerExecutionTiming>;
  const mockGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<typeof getActiveReportersForSubmissionCheck>;
  const mockCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<typeof checkDailyReportExistsForDate>;
  const mockRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<typeof retrieveNonSubmissionDetectionLogsByDate>;
  const mockUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<typeof updateNonSubmissionDetectionLogWithReminderStatus>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('日報提出状況の確認処理がエラーをスローした場合、SubmissionStatusCheckFailureError をスローし、DetectionLogRecordingFailureError はスローしない', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:05:00Z',
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
    ]);

    mockCheckDailyReportExistsForDate.mockRejectedValue(new Error('ネットワークタイムアウト'));

    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockUpdateNonSubmissionDetectionLogWithReminderStatus.mockRejectedValue(new Error('データベース接続失敗'));

    let thrownError: unknown;
    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(SubmissionStatusCheckFailureError);
    expect((thrownError as Error).message).toContain('日報提出状況の確認に失敗しました。');
  });
});
