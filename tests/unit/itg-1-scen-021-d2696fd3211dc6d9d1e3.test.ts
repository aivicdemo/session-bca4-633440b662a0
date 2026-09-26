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

class PromptNotificationSendingFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromptNotificationSendingFailed';
  }
}

describe('SCEN-021: 未提出者への催促メール送信に失敗した場合', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705310400000;
  const leaderUserIds = ['leader1'];

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
        { userId: 'U2', userName: '報告者2', emailAddress: 'r002@example.com', departmentId: 'D001' },
        { userId: 'U3', userName: '報告者3', emailAddress: 'r003@example.com', departmentId: 'D001' },
        { userId: 'U4', userName: '報告者4', emailAddress: 'r004@example.com', departmentId: 'D001' },
      ],
      detectionLog: {
        detectionLogId: 'LOG-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T17:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 3,
        submittedCount: 2,
      },
      detectionTimestamp: '2024-01-15T17:00:00Z',
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockRejectedValue(
      new PromptNotificationSendingFailed('催促メール送信に失敗しました。')
    );

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-001',
      sentAt: new Date(executionTimestamp),
      deliveryMethod: 'email',
      errorDetails: null,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: [
        { reportId: 'R1', reporterId: 'U1', reporterName: '報告者1', submissionTime: '2024-01-15T16:50:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
        { reportId: 'R5', reporterId: 'U5', reporterName: '報告者5', submissionTime: '2024-01-15T16:59:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
      ],
      nonSubmittedReporters: [
        { userId: 'U2', userName: '報告者2', emailAddress: 'r002@example.com', departmentId: 'D001' },
        { userId: 'U3', userName: '報告者3', emailAddress: 'r003@example.com', departmentId: 'D001' },
        { userId: 'U4', userName: '報告者4', emailAddress: 'r004@example.com', departmentId: 'D001' },
      ],
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 5,
        submittedCount: 2,
        nonSubmittedCount: 3,
        reminderSentCount: 0,
        submissionRate: 40,
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
    ).rejects.toThrow(PromptNotificationSendingFailed);

    expect(mockedJudgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
  });
});
