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

describe('SCEN-252: 業務ルール br-tx_1-005 の制約 4 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('期限到達、有効報告者存在、提出状況確認成功、検知ログ記録成功時に正常終了する', async () => {
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
        exists: ['user-001', 'user-002', 'user-003'].includes(userId),
      });
    });

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    });

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.every(r => r.userId && r.userName && r.emailAddress)).toBe(true);

    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
