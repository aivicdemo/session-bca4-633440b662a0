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

describe('SCEN-249: 未提出者のユーザーID、氏名、メールアドレス、所属を含む一覧を返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('期限時刻ちょうどに、未提出者の正確な情報を返す', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'TEAM-001';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    const activeReporters = [
      { userId: 'U001', userName: 'Reporter 1', emailAddress: 'u001@example.com', promptPriority: 'high' },
      { userId: 'U002', userName: 'Reporter 2', emailAddress: 'u002@example.com', promptPriority: 'high' },
      { userId: 'U003', userName: 'Reporter 3', emailAddress: 'u003@example.com', promptPriority: 'high' },
      { userId: 'U004', userName: 'Reporter 4', emailAddress: 'u004@example.com', promptPriority: 'high' },
      { userId: 'U005', userName: 'Reporter 5', emailAddress: 'u005@example.com', promptPriority: 'high' },
    ];

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(activeReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      return Promise.resolve({
        exists: ['U001', 'U003', 'U005'].includes(userId),
      });
    });

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(2);

    const u002 = result.nonSubmittedReporters.find(r => r.userId === 'U002');
    expect(u002).toBeDefined();
    expect(u002?.userName).toBe('Reporter 2');
    expect(u002?.emailAddress).toBe('u002@example.com');
    expect(u002?.userId).toBe('U002');

    const u004 = result.nonSubmittedReporters.find(r => r.userId === 'U004');
    expect(u004).toBeDefined();
    expect(u004?.userName).toBe('Reporter 4');
    expect(u004?.emailAddress).toBe('u004@example.com');
    expect(u004?.userId).toBe('U004');

    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
