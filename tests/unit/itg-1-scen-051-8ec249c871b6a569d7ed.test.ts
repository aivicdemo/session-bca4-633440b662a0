jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.Mock;

class SchedulerExecutionTimingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulerExecutionTimingError';
  }
}

describe('SCEN-051: スケジューラ実行タイミングが営業日カレンダーと不整合で処理が失敗する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('スケジューラ実行タイミング判定がエラーを返し、処理が失敗し、以降の処理は呼び出されない', async () => {
    const targetDate = '2024-01-15';
    const executionContext = {
      scheduledAt: '2024-01-15T17:30:00Z',
      executedBy: 'system',
    };

    mockedJudgeSchedulerExecutionTiming.mockRejectedValue(
      new SchedulerExecutionTimingError(
        '定時スケジューラの実行タイミングが不正です。営業日カレンダーと実行時刻を確認してください。'
      )
    );

    const input = {
      targetDate: targetDate,
      executionContext: executionContext,
    };

    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');

    expect(result.errorDetails).not.toBeNull();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    
    const errorDetail = result.errorDetails[0];
    expect(errorDetail.step).toBe('judgeSchedulerExecutionTiming');
    expect(errorDetail.errorCode).toBe('SchedulerExecutionTimingError');
    expect(errorDetail.errorMessage).toContain('定時スケジューラの実行タイミングが不正です');

    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.detectionLogId).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);

    expect(mockedGetActiveReportersForSubmissionCheck).not.toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(mockedJudgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
