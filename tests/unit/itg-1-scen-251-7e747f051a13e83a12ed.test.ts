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
import { checkDailyReportExistsForDate, updateNonSubmissionDetectionLogWithReminderStatus } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<any>;

describe('SCEN-251: 全員が期限までに提出しなかった場合は全員が未提出者として返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('全員が未提出の場合、全員が未提出者一覧に含まれる', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:30:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'TEAM-001';

    (mockedJudgeSchedulerExecutionTiming as jest.Mock<any>).mockResolvedValue(true);

    const activeReporters = [
      { userId: 'R001', userName: 'Reporter 1', emailAddress: 'r001@example.com', department: 'Sales', promptPriority: 'high' },
      { userId: 'R002', userName: 'Reporter 2', emailAddress: 'r002@example.com', department: 'Marketing', promptPriority: 'high' },
      { userId: 'R003', userName: 'Reporter 3', emailAddress: 'r003@example.com', department: 'Engineering', promptPriority: 'high' },
      { userId: 'R004', userName: 'Reporter 4', emailAddress: 'r004@example.com', department: 'Sales', promptPriority: 'high' },
      { userId: 'R005', userName: 'Reporter 5', emailAddress: 'r005@example.com', department: 'HR', promptPriority: 'high' },
    ];

    (mockedGetActiveReportersForSubmissionCheck as jest.Mock<any>).mockResolvedValue({
      reporters: activeReporters,
    });

    mockedCheckDailyReportExistsForDate.mockImplementation(() => {
      return Promise.resolve(false);
    });

    (mockedUpdateNonSubmissionDetectionLogWithReminderStatus as jest.Mock<any>).mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(5);
    expect(result.nonSubmittedReporters.map(r => r.userId)).toEqual(['R001', 'R002', 'R003', 'R004', 'R005']);

    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(5);
    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:30:00Z');

    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
