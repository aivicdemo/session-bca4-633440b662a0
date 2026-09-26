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

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;

describe('SCEN-245: 報告期限時刻が不正な形式の場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('不正な形式の報告期限時刻では処理を拒否する', async () => {
    const invalidTimestamps = ['25:00', '17時', '17-00', '17:0', '1700'];

    for (const invalidTime of invalidTimestamps) {
      mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

      const input = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:00:00Z',
        submissionDeadlineTime: invalidTime,
        teamId: 'team-001',
      };

      try {
        await detectNonSubmittedReportersAtDeadline(input);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    }
  });
});
