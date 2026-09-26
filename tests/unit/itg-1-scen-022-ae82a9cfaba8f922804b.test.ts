import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
  sendLeaderSubmissionNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  retrieveLeaderDashboardData: jest.fn(),
}));

import { runTx2Imp1Agent, type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { sendLeaderNonSubmissionPromptNotification, sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.MockedFunction<any>;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.MockedFunction<any>;

class LeaderNotificationSendingFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeaderNotificationSendingFailed';
  }
}

describe('SCEN-022: リーダーへの提出状況報告メール送信に失敗した場合', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '定時実行タイミング内',
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'LOG-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T17:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 0,
        submittedCount: 5,
      },
      detectionTimestamp: '2024-01-15T17:00:00Z',
    });

    mockedSendLeaderSubmissionNotification.mockRejectedValue(
      new LeaderNotificationSendingFailed('リーダーへの報告メール送信に失敗しました。')
    );

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: [],
      nonSubmittedReporters: [],
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 5,
        submittedCount: 5,
        nonSubmittedCount: 0,
        reminderSentCount: 0,
        submissionRate: 100,
      },
    });
  });

  it('partial_failureステータスが返される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {};

    await expect(
      runTx2Imp1Agent(
        { targetDate, executionTimestamp, leaderUserIds },
        mockAiClient
      )
    ).rejects.toThrow(LeaderNotificationSendingFailed);

    expect(mockedJudgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockedSendLeaderSubmissionNotification).toHaveBeenCalled();
  });
});
