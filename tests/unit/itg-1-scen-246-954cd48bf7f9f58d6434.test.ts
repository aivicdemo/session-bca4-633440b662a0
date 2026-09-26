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

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;

describe('SCEN-246: 報告者マスタが空の場合は警告を返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('有効な報告者が存在しない場合、NoActiveReportersError を throw する', async () => {
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([]);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:05:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      })
    ).rejects.toThrow(new NoActiveReportersError('検知対象の有効な報告者が存在しません。'));
  });
});
