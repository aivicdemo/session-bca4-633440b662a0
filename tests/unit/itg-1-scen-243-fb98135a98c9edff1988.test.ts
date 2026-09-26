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

import { detectNonSubmittedReportersAtDeadline, DeadlineNotReachedError } from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;

describe('SCEN-243: 提出期限に達していない場合の検知をスキップする', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('期限未到達の場合、DeadlineNotReachedError を throw する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T16:30:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(false);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      })
    ).rejects.toThrow(new DeadlineNotReachedError('日報提出期限に達していないため、未提出者検知を実行できません。'));
  });
});
