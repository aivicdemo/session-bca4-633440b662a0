jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
  updateNonSubmissionDetectionLogWithReminderStatus: jest.fn(),
}));

import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import {
  checkDailyReportExistsForDate,
  retrieveNonSubmissionDetectionLogsByDate,
  updateNonSubmissionDetectionLogWithReminderStatus,
} from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockedUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<any>;

describe('SCEN-241: 報告者ごとの提出状況を提出時刻付きで正しく識別して返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: 'Deadline reached',
    });
  });

  it('未提出者と提出済み者を正しく識別し、未提出者のみを返す', async () => {
    const targetDate = '2024-01-15';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';
    const currentDateTime = '2024-01-15T17:30:00Z';

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
      {
        userId: 'reporter-001',
        userName: '太郎',
        emailAddress: 'taro@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-002',
        userName: '花子',
        emailAddress: 'hanako@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-003',
        userName: '次郎',
        emailAddress: 'jiro@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-004',
        userName: '美咲',
        emailAddress: 'misaki@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-005',
        userName: '健太',
        emailAddress: 'kenta@example.com',
        department: '営業部',
      },
      ],
      totalCount: 5,
      message: 'Retrieved reporters',
    });

    mockedCheckDailyReportExistsForDate.mockImplementation(async (input: any) => {
      const submissionMap: any = {
        'reporter-001': true,
        'reporter-002': true,
        'reporter-003': false,
        'reporter-004': true,
        'reporter-005': false,
      };
      return submissionMap[input.userId];
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T17:30:00Z',
    });

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue({
      detectionLogId: 'log-001',
      reminderSent: false,
      updatedAt: '2024-01-15T17:30:00Z',
    });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'reporter-003',
      userName: '次郎',
      emailAddress: 'jiro@example.com',
      department: '営業部',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'reporter-005',
      userName: '健太',
      emailAddress: 'kenta@example.com',
      department: '営業部',
    });

    const ids = result.nonSubmittedReporters.map((r) => r.userId);
    expect(ids).not.toContain('reporter-001');
    expect(ids).not.toContain('reporter-002');
    expect(ids).not.toContain('reporter-004');

    expect(result.detectionLog).toHaveProperty('targetDate', '2024-01-15');
    expect(result.detectionLog).toHaveProperty('detectionDateTime', '2024-01-15T17:30:00Z');
    expect(result.detectionLog).toHaveProperty('totalReportersCount', 5);
    expect(result.detectionLog).toHaveProperty('nonSubmittedCount', 2);
    expect(result.detectionLog).toHaveProperty('submittedCount', 3);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
