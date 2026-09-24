import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
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

describe('SCEN-224: 提出期限到達時点で、提出済みと未提出の報告者を正しく識別して未提出者一覧を返す', () => {
  const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<typeof judgeSchedulerExecutionTiming>;
  const mockGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<typeof getActiveReportersForSubmissionCheck>;
  const mockCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<typeof checkDailyReportExistsForDate>;
  const mockRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<typeof retrieveNonSubmissionDetectionLogsByDate>;
  const mockUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<typeof updateNonSubmissionDetectionLogWithReminderStatus>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出期限に達した時点で、5名の報告者のうち3名が提出済み、2名が未提出の場合、未提出者2名の情報を含む結果を返す', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:05:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'TEAM-001',
    };

    mockJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    mockGetActiveReportersForSubmissionCheck.mockResolvedValue([
      {
        userId: 'USER-001',
        userName: '山田太郎',
        emailAddress: 'yamada.taro@example.com',
        departmentId: 'DEPT-001',
      },
      {
        userId: 'USER-002',
        userName: '佐藤花子',
        emailAddress: 'sato.hanako@example.com',
        departmentId: 'DEPT-001',
      },
      {
        userId: 'USER-003',
        userName: '鈴木次郎',
        emailAddress: 'suzuki.jiro@example.com',
        departmentId: 'DEPT-002',
      },
      {
        userId: 'USER-004',
        userName: '田中美咲',
        emailAddress: 'tanaka.misaki@example.com',
        departmentId: 'DEPT-002',
      },
      {
        userId: 'USER-005',
        userName: '伊藤健太',
        emailAddress: 'ito.kenta@example.com',
        departmentId: 'DEPT-003',
      },
    ]);

    mockCheckDailyReportExistsForDate.mockImplementation(async (userId: string) => {
      return ['USER-001', 'USER-002', 'USER-003'].includes(userId);
    });

    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue({
      logId: 'LOG-001',
      detectionDate: '2024-01-15',
      detectionTimestamp: '2024-01-15T17:05:00Z',
      teamId: 'TEAM-001',
      targetReportersCount: 5,
      nonSubmittedCount: 2,
      reminderStatus: 'pending',
    });

    const result = await detectNonSubmittedReportersAtDeadline(input);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters).toEqual([
      {
        userId: 'USER-004',
        userName: '田中美咲',
        emailAddress: 'tanaka.misaki@example.com',
        departmentId: 'DEPT-002',
      },
      {
        userId: 'USER-005',
        userName: '伊藤健太',
        emailAddress: 'ito.kenta@example.com',
        departmentId: 'DEPT-003',
      },
    ]);

    expect(result.detectionLog).toBeDefined();
    expect(result.detectionLog.detectionTimestamp).toBe('2024-01-15T17:05:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.targetReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:05:00Z');
  });
});
