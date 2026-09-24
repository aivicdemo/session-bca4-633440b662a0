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

import { detectNonSubmittedReportersAtDeadline, NoActiveReportersError } from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;

describe('SCEN-246: 報告者マスタが空の場合は警告を返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('有効な報告者が存在しない場合、NoActiveReportersError を throw する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:05:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    mockedJudgeSchedulerExecutionTiming.mockReturnValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockReturnValue([]);

    const error = new NoActiveReportersError('検知対象の有効な報告者が存在しません。');

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      })
    ).rejects.toThrow(error);
  });
});
