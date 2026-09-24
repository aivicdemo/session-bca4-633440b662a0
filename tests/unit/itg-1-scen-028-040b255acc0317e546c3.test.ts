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

export class NonSubmissionDetectionFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonSubmissionDetectionFailure';
  }
}

describe('SCEN-028: 未提出者検知処理が失敗し、NonSubmissionDetectionFailureが発生する', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];
  const mockAiClient: Tx3Imp1AiClient = {
    invokeModel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // judgeSchedulerExecutionTiming returns success
    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue({
      isSchedulerTimingValid: true,
    });

    // detectNonSubmittedReportersAtDeadline throws NonSubmissionDetectionFailure
    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockImplementation(() => {
      throw new NonSubmissionDetectionFailure('未提出者の検知に失敗しました。');
    });
  });

  test('should throw NonSubmissionDetectionFailure when detection fails', async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(
      NonSubmissionDetectionFailure
    );

    // Verify that generateNonSubmissionDetectionResult and subsequent operations were NOT called
    expect(generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });

  test('should propagate correct error message from NonSubmissionDetectionFailure', async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
      fail('Expected NonSubmissionDetectionFailure to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NonSubmissionDetectionFailure);
      expect((error as Error).message).toContain('未提出者の検知に失敗しました。');
    }
  });

  test('should verify judgeSchedulerExecutionTiming was called before detection failure', async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
    } catch (error) {
      // Expected error
    }

    // Verify judgeSchedulerExecutionTiming was called at least once
    expect(judgeSchedulerExecutionTiming).toHaveBeenCalled();
  });
});
