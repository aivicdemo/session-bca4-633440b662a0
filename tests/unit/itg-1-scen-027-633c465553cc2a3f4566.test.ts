import {
  runTx3Imp1Agent,
  Tx3Imp1AiClient,
} from '../../src/agents/tx-3-imp-1/orchestrator';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
  generateNonSubmissionDetectionResult: jest.fn(),
}));

jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));

jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-management-view', () => ({
  retrieveLeaderDashboardData: jest.fn(),
}));

import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import {
  detectNonSubmittedReportersAtDeadline,
  generateNonSubmissionDetectionResult,
} from '../../src/logic/daily-report-non-submission-detection';
import {
  judgePromptNecessityAndMethod,
} from '../../src/logic/non-submission-prompt-decision';
import {
  sendLeaderNonSubmissionPromptNotification,
} from '../../src/logic/daily-report-reminder-notification';
import {
  sendNonSubmissionPromptNotification,
} from '../../src/logic/email-notification-management';
import {
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import {
  retrieveLeaderDashboardData,
} from '../../src/logic/daily-report-management-view';

export class SchedulerExecutionTimingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulerExecutionTimingError';
  }
}

describe('SCEN-027: 定時スケジューラの実行タイミング判定に失敗し、SchedulerExecutionTimingErrorが発生する', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader001'];
  const mockAiClient: Tx3Imp1AiClient = {
    invokeModel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockImplementation(() => {
      throw new SchedulerExecutionTimingError('定時スケジューラの実行タイミング判定に失敗しました。');
    });
  });

  test('should throw SchedulerExecutionTimingError and not call subsequent operations', async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(
      SchedulerExecutionTimingError
    );

    // Verify that subsequent operations were NOT called
    expect(detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });

  test('should have correct error message', async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
      fail('Expected SchedulerExecutionTimingError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(SchedulerExecutionTimingError);
      expect((error as Error).message).toBe('定時スケジューラの実行タイミング判定に失敗しました。');
    }
  });
});
