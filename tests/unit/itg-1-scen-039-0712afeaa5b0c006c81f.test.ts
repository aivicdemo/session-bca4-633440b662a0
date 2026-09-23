jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));

import {
  runTx4Imp1Agent,
  TargetDateNotBusinessDay,
} from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;

describe('SCEN-039: 対象日が営業日でない場合、TargetDateNotBusinessDayエラーが発生し処理が中断される', () => {
  const targetDate = '2025-01-11';
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: false,
      isBusinessDay: false,
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: null,
      processingPolicy: 'reject',
      rejectionReason: '対象日は営業日ではありません。',
    });
  });

  it('TargetDateNotBusinessDayエラーが発生し、以降の処理・通知が一切実行されない', async () => {
    let thrownError: unknown = null;
    let result: any = undefined;

    try {
      result = await runTx4Imp1Agent({
        targetDate,
        leaderUserId,
        teamId,
      });
    } catch (err) {
      thrownError = err;
    }

    if (thrownError !== null) {
      expect(thrownError).toBeInstanceOf(TargetDateNotBusinessDay);
      expect((thrownError as Error).message).toBe(
        '対象日が営業日ではないため処理を実行できません。'
      );
    } else {
      expect(result?.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'TargetDateNotBusinessDay',
            message: '対象日が営業日ではないため処理を実行できません。',
          }),
        ])
      );
    }

    expect(mockedRetrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(mockedSendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
