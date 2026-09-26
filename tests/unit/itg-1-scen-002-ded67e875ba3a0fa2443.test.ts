import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-submission', () => ({
  submitDailyReport: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));

import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;

class SchedulerExecutionTimingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulerExecutionTimingError';
  }
}

describe('SCEN-002: スケジューラ実行タイミング判定に失敗し、エージェント全体が失敗する', () => {
  const executionTimestamp = new Date('2024-01-15T16:00:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = {
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
    auth: { isAuthenticated: true },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockRejectedValue(
      new SchedulerExecutionTimingError(
        '業務終了時刻の判定に失敗しました。スケジューラ実行タイミングを確認してください。'
      )
    );
  });

  it('SchedulerExecutionTimingErrorが発生し、エージェント全体が失敗する', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.reportersPrompted).toBe(0);
    expect(result.reportsSubmitted).toBe(0);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].errorCode).toContain('SchedulerExecutionTimingError');
    expect(result.errors?.[0].errorMessage).toBe(
      '業務終了時刻の判定に失敗しました。スケジューラ実行タイミングを確認してください。'
    );
    expect(result.executionSummary).toContain('失敗');
  });
});
