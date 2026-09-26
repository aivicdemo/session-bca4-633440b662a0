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

describe('SCEN-020: 提出期限に達した対象日付で、一部の報告者が未提出の場合', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705315200000;
  const leaderUserIds = ['leader-001'];

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

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: [
        { reportId: 'R1', reporterId: 'U1', reporterName: '報告者1', submissionTime: '2024-01-15T16:50:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
        { reportId: 'R3', reporterId: 'U3', reporterName: '報告者3', submissionTime: '2024-01-15T16:58:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
        { reportId: 'R5', reporterId: 'U5', reporterName: '報告者5', submissionTime: '2024-01-15T16:59:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
      ],
      nonSubmittedReporters: [
        { userId: 'U2', userName: '報告者2', emailAddress: 'r002@example.com', departmentId: 'D001' },
        { userId: 'U4', userName: '報告者4', emailAddress: 'r004@example.com', departmentId: 'D001' },
      ],
      detectionLogs: [
        { detectionLogId: 'LOG-001', targetDate: '2024-01-15', detectionDateTime: '2024-01-15T17:00:00Z', totalReportersCount: 5, nonSubmittedCount: 2, submittedCount: 3 },
      ],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 5,
        submittedCount: 3,
        nonSubmittedCount: 2,
        reminderSentCount: 1,
        submissionRate: 60,
      },
    });
  });

  it('検知結果に未提出者が含まれ、催促メール送信レコードが生成される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(
      { targetDate, executionTimestamp, leaderUserIds },
      mockAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.detectionResult.detectionCount).toBe(2);
    expect(result.promptNotificationsSent.length).toBe(2);
    expect(result.promptNotificationsSent[0].reporterUserId).toMatch(/U2|U4/);
    expect(result.leaderNotificationsSent.length).toBeGreaterThanOrEqual(1);
    expect(result.dashboardData.submittedReportCount).toBe(3);
    expect(result.dashboardData.nonSubmittedReporterCount).toBe(2);
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);

    expect(mockedJudgePromptNecessityAndMethod).toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
  });
});
