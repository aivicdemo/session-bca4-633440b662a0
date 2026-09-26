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
import { checkDailyReportExistsForDate, updateNonSubmissionDetectionLogWithReminderStatus } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<any>;

describe('SCEN-248: 検知実行日時、対象日付、検知対象者数、未提出者数を記録した検知ログを生成する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('検知ログが正しい値を含むことを検証する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:30:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'TEAM-001';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    const activeReporters = [
      { userId: 'user-001', userName: 'Reporter 1', emailAddress: 'reporter1@example.com', promptPriority: 'high' },
      { userId: 'user-002', userName: 'Reporter 2', emailAddress: 'reporter2@example.com', promptPriority: 'high' },
      { userId: 'user-003', userName: 'Reporter 3', emailAddress: 'reporter3@example.com', promptPriority: 'high' },
      { userId: 'user-004', userName: 'Reporter 4', emailAddress: 'reporter4@example.com', promptPriority: 'high' },
      { userId: 'user-005', userName: 'Reporter 5', emailAddress: 'reporter5@example.com', promptPriority: 'high' },
    ];

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(activeReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      return Promise.resolve({
        exists: ['user-001', 'user-002'].includes(userId),
      });
    });

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:30:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(3);
    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
