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

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;

describe('SCEN-245: 報告期限時刻が不正な形式の場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const invalidFormats = ['25:00', '17時', '17-00', '17:0', '1700'];

  invalidFormats.forEach((format) => {
    it(`submissionDeadlineTime = '${format}' の場合、処理を拒否する`, async () => {
      const targetDate = '2024-01-15';
      const currentDateTime = '2024-01-15T17:00:00Z';
      const submissionDeadlineTime = format;
      const teamId = 'team-001';

      mockedJudgeSchedulerExecutionTiming.mockImplementation(() => {
        throw new Error(`報告期限時刻の形式が正しくありません（HH:mm形式で指定してください）`);
      });

      await expect(
        detectNonSubmittedReportersAtDeadline({
          targetDate,
          currentDateTime,
          submissionDeadlineTime,
          teamId,
        })
      ).rejects.toThrow();
    });
  });
});
