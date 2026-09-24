jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));

import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;

describe('SCEN-039: 指定対象日が営業日でない場合、TargetDateNotBusinessDayエラーが発生し処理が中断される', () => {
  const targetDate = '2025-01-11';
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockRejectedValue(
      new Error('TargetDateNotBusinessDay')
    );
  });

  it('should throw TargetDateNotBusinessDay error when target date is not a business day', async () => {
    const fakeAiClient = {};

    try {
      await runTx4Imp1Agent(
        { targetDate, leaderUserId, teamId },
        fakeAiClient
      );
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('TargetDateNotBusinessDay');
    }
  });

  it('should not call downstream functions when business day check fails', async () => {
    const fakeAiClient = {};

    try {
      await runTx4Imp1Agent(
        { targetDate, leaderUserId, teamId },
        fakeAiClient
      );
    } catch (error) {
      // Expected error
    }

    expect(mockedRetrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(mockedSendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
