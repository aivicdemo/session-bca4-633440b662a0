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

describe('SCEN-250: 全員が期限までに提出した場合は未提出者一覧が空になる', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('全員が提出済みの場合、未提出者一覧は空配列となる', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    const activeReporters = [
      { userId: 'user-001', name: 'Reporter 1', email: 'reporter1@example.com', department: 'Sales' },
      { userId: 'user-002', name: 'Reporter 2', email: 'reporter2@example.com', department: 'Marketing' },
      { userId: 'user-003', name: 'Reporter 3', email: 'reporter3@example.com', department: 'Engineering' },
      { userId: 'user-004', name: 'Reporter 4', email: 'reporter4@example.com', department: 'Sales' },
      { userId: 'user-005', name: 'Reporter 5', email: 'reporter5@example.com', department: 'HR' },
    ];

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(activeReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation(() => {
      return Promise.resolve({ exists: true });
    });

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(0);
    expect(result.detectionLog.nonSubmittedCount).toBe(0);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionTimestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  });
});
