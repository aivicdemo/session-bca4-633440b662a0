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
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification, sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.MockedFunction<any>;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.MockedFunction<any>;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.MockedFunction<any>;

class DashboardDataRetrievalFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardDataRetrievalFailed';
  }
}

describe('SCEN-023: 管理画面表示用ダッシュボードデータ取得に失敗した場合', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705305600000;
  const leaderUserIds = ['leader001'];

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
      nonSubmittedReporters: [
        { userId: 'U3', userName: '報告者3', emailAddress: 'r003@example.com', departmentId: 'D001' },
        { userId: 'U4', userName: '報告者4', emailAddress: 'r004@example.com', departmentId: 'D001' },
      ],
      detectionLog: {
        detectionLogId: 'LOG-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T17:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 2,
        submittedCount: 3,
      },
      detectionTimestamp: '2024-01-15T17:00:00Z',
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptNecessary: true,
      promptPriority: 'high',
      promptMethod: 'email',
      estimatedNonSubmissionReason: 'input_forgotten',
      suggestedPromptMessage: '日報の提出をお願いします',
      overdueDurationMinutes: 60,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-002',
      sentAt: new Date(executionTimestamp),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 2,
      errorDetails: null,
    });

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-001',
      sentAt: new Date(executionTimestamp),
      deliveryMethod: 'email',
      errorDetails: null,
    });

    mockedRetrieveLeaderDashboardData.mockRejectedValue(
      new DashboardDataRetrievalFailed('管理画面データの取得に失敗しました。')
    );
  });

  it('partial_failureステータスが返される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {};

    await expect(
      runTx2Imp1Agent(
        { targetDate, executionTimestamp, leaderUserIds },
        mockAiClient
      )
    ).rejects.toThrow(DashboardDataRetrievalFailed);

    expect(mockedJudgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(mockedSendLeaderSubmissionNotification).toHaveBeenCalled();
    expect(mockedRetrieveLeaderDashboardData).toHaveBeenCalled();
  });
});
