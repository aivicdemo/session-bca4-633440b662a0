jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reporter-master-management')>('../../src/logic/reporter-master-management'),
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  checkDailyReportExistsForDate: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
  updateNonSubmissionDetectionLogWithReminderStatus: jest.fn(),
}));

import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { checkDailyReportExistsForDate, retrieveNonSubmissionDetectionLogsByDate, updateNonSubmissionDetectionLogWithReminderStatus } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockedUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<any>;

describe('SCEN-258: 業務ルール br-tx_1-005 の制約 10 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('制約10: 定時に日報提出期限を迎えた時点で、本日未提出の報告者を自動検知する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    const activeReporters = [
      { userId: 'reporter-a', userName: '報告者A', emailAddress: 'reporter-a@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-b', userName: '報告者B', emailAddress: 'reporter-b@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-c', userName: '報告者C', emailAddress: 'reporter-c@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-d', userName: '報告者D', emailAddress: 'reporter-d@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-e', userName: '報告者E', emailAddress: 'reporter-e@example.com', department: '営業部', promptPriority: 'high' },
    ];

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(activeReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      const submitted = ['reporter-a', 'reporter-b', 'reporter-c'];
      if (submitted.includes(userId)) {
        return Promise.resolve({ submittedAt: '2024-01-15T16:00:00Z' });
      }
      return Promise.resolve(null);
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue({ detectionLogId: 'log-001' });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.map((r) => r.userId)).toEqual(['reporter-d', 'reporter-e']);
    expect(result.nonSubmittedReporters[0].userName).toBe('報告者D');
    expect(result.nonSubmittedReporters[0].emailAddress).toBe('reporter-d@example.com');
    expect(result.nonSubmittedReporters[0].department).toBe('営業部');
    expect(result.nonSubmittedReporters[1].userName).toBe('報告者E');
    expect(result.nonSubmittedReporters[1].emailAddress).toBe('reporter-e@example.com');
    expect(result.nonSubmittedReporters[1].department).toBe('営業部');

    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
