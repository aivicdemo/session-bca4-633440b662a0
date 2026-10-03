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

describe('SCEN-250: 全員が期限までに提出した場合は未提出者一覧が空になる', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('全員が提出済みの場合、未提出者一覧は空配列となる', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    (mockedJudgeSchedulerExecutionTiming as jest.Mock<any>).mockResolvedValue(true);

    const activeReporters = [
      { userId: 'user-001', userName: 'Reporter 1', emailAddress: 'reporter1@example.com', department: 'Sales', promptPriority: 'high' },
      { userId: 'user-002', userName: 'Reporter 2', emailAddress: 'reporter2@example.com', department: 'Marketing', promptPriority: 'high' },
      { userId: 'user-003', userName: 'Reporter 3', emailAddress: 'reporter3@example.com', department: 'Engineering', promptPriority: 'high' },
      { userId: 'user-004', userName: 'Reporter 4', emailAddress: 'reporter4@example.com', department: 'Sales', promptPriority: 'high' },
      { userId: 'user-005', userName: 'Reporter 5', emailAddress: 'reporter5@example.com', department: 'HR', promptPriority: 'high' },
    ];

    (mockedGetActiveReportersForSubmissionCheck as jest.Mock<any>).mockResolvedValue({
      reporters: activeReporters,
    });

    mockedCheckDailyReportExistsForDate.mockImplementation(() => {
      return Promise.resolve(true);
    });

    (mockedUpdateNonSubmissionDetectionLogWithReminderStatus as jest.Mock<any>).mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(0);
    expect(result.detectionLog.nonSubmittedCount).toBe(0);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
