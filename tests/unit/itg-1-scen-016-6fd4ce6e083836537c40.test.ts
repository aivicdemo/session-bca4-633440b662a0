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

describe('SCEN-016: 提出期限に達した対象日付で、全員が日報を提出済みの場合', () => {
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
        { reportId: 'R2', reporterId: 'U2', reporterName: '報告者2', submissionTime: '2024-01-15T16:55:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
        { reportId: 'R3', reporterId: 'U3', reporterName: '報告者3', submissionTime: '2024-01-15T16:58:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
        { reportId: 'R4', reporterId: 'U4', reporterName: '報告者4', submissionTime: '2024-01-15T16:52:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
        { reportId: 'R5', reporterId: 'U5', reporterName: '報告者5', submissionTime: '2024-01-15T16:59:00Z', businessContent: '営業活動', achievements: '目標達成', issues: 'なし', tomorrowPlan: '続行' },
      ],
      nonSubmittedReporters: [],
      detectionLogs: [
        { detectionLogId: 'LOG-001', targetDate: '2024-01-15', detectionDateTime: '2024-01-15T17:00:00Z', totalReportersCount: 5, nonSubmittedCount: 0, submittedCount: 5 },
      ],
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

  it('成功ステータスで実行完了し、未提出者なし・催促メール送信なし・リーダーに提出状況報告を送信する', async () => {
    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(
      { targetDate, executionTimestamp, leaderUserIds },
      mockAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.detectionResult.detectionCount).toBe(0);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.leaderNotificationsSent.length).toBeGreaterThanOrEqual(1);
    expect(result.leaderNotificationsSent[0].leaderUserId).toBe('leader-001');
    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData.submittedReportCount).toBe(5);
    expect(result.dashboardData.nonSubmittedReporterCount).toBe(0);
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);

    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockedSendLeaderSubmissionNotification).toHaveBeenCalled();
    expect(mockedRetrieveLeaderDashboardData).toHaveBeenCalled();
  });
});
