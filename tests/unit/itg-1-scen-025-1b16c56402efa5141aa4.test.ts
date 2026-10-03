import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AgentInput,
  type Tx2Imp1AiClient,
} from '../../src/agents/tx-2-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminderNotification from '../../src/logic/daily-report-reminder-notification';
import * as dailyReportManagementView from '../../src/logic/daily-report-management-view';

describe("SCEN-025: リーダーユーザーID配列が空の場合、提出状況報告メール送信レコードが空で実行完了する", () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705315200000;

  beforeEach(() => {
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming')
      .mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
        nextScheduledExecutionTime: null,
        executionReason: 'Scheduled execution time reached',
      });

    jest.spyOn(dailyReportNonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline')
      .mockResolvedValue({
        nonSubmittedReporters: [
          {
            userId: 'emp001',
            userName: '田中太郎',
            emailAddress: 'tanaka@example.com',
            departmentId: 'dept001',
            targetDate,
          },
          {
            userId: 'emp002',
            userName: '鈴木花子',
            emailAddress: 'suzuki@example.com',
            departmentId: 'dept002',
            targetDate,
          },
        ],
        detectionLog: {
          detectionLogId: 'log001',
          targetDate,
          detectionDateTime: new Date(executionTimestamp).toISOString(),
          totalReportersCount: 10,
          nonSubmittedCount: 2,
          submittedCount: 8,
        },
        detectionTimestamp: new Date(executionTimestamp).toISOString(),
      });

    jest.spyOn(nonSubmissionPromptDecision, 'judgePromptNecessityAndMethod')
      .mockResolvedValue({
        isPromptNecessary: true,
        promptPriority: 'high',
        promptMethod: 'email',
        estimatedNonSubmissionReason: 'input_forgotten',
        suggestedPromptMessage: 'Please submit your daily report',
        overdueDurationMinutes: 60,
      });

    jest.spyOn(dailyReportReminderNotification, 'sendLeaderNonSubmissionPromptNotification')
      .mockResolvedValue({
        success: true,
        notificationId: 'notif001',
        sentAt: new Date(executionTimestamp),
        deliveryMethod: 'email',
        nonSubmittedReporterCount: 2,
        errorDetails: null,
      });

    jest.spyOn(dailyReportReminderNotification, 'sendLeaderSubmissionNotification')
      .mockResolvedValue({
        success: true,
        notificationId: 'notif002',
        sentAt: new Date(executionTimestamp),
        deliveryMethod: 'email',
        errorDetails: null,
      });

    jest.spyOn(dailyReportManagementView, 'retrieveLeaderDashboardData')
      .mockResolvedValue({
        submittedReports: [
          {
            reportId: 'rep001',
            reporterId: 'emp003',
            reporterName: '佐藤次郎',
            submissionTime: '2024-01-15T10:00:00Z',
            businessContent: 'プロジェクトA進行中',
            achievements: '設計完了',
            issues: 'なし',
            tomorrowPlan: '実装開始',
            displayDate: '2024-01-15',
            displayReporterName: '佐藤次郎',
            displaySubmissionTime: '10:00',
            displayContent: 'プロジェクトA進行中',
            isLate: false,
          },
        ],
        nonSubmittedReporters: [
          {
            userId: 'emp001',
            userName: '田中太郎',
            emailAddress: 'tanaka@example.com',
            promptSent: true,
          },
          {
            userId: 'emp002',
            userName: '鈴木花子',
            emailAddress: 'suzuki@example.com',
            promptSent: true,
          },
        ],
        detectionLogs: [
          {
            detectionLogId: 'log001',
            targetDate,
            detectionDateTime: new Date(executionTimestamp).toISOString(),
            totalReportersCount: 10,
            nonSubmittedCount: 2,
            submittedCount: 8,
            detectionTimestamp: new Date(executionTimestamp).toISOString(),
          },
        ],
        emailSendingHistory: [
          {
            historyId: 'hist001',
            recipientId: 'emp001',
            recipientEmail: 'tanaka@example.com',
            emailType: 'non_submission_prompt',
            subject: '日報提出催促',
            sentTime: new Date(executionTimestamp).toISOString(),
            sendingStatus: 'success',
            errorMessage: null,
          },
        ],
        submissionStatusSummary: {
          totalReporters: 10,
          submittedCount: 8,
          nonSubmittedCount: 2,
          reminderSentCount: 2,
          submissionRate: 0.8,
        },
      });
  });

  it("executionStatus が 'success' であることを確認", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds: [],
    };

    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
  });

  it("targetDate が入力値と同一（'2024-01-15'）であることを確認", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds: [],
    };

    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.targetDate).toBe('2024-01-15');
  });

  it("detectionResult が型として正しく、未提出者検知の結果が格納されていることを確認", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds: [],
    };

    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.detectionResult).toBeDefined();
    expect(result.detectionResult).toHaveProperty('nonSubmittedReporterIds');
    expect(result.detectionResult).toHaveProperty('detectionLogId');
    expect(result.detectionResult).toHaveProperty('detectionCount');
  });

  it("promptNotificationsSent が PromptNotificationRecord[] 型の配列で、1件以上の記録が存在することを確認", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds: [],
    };

    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
    expect(result.promptNotificationsSent.length).toBeGreaterThanOrEqual(1);
    result.promptNotificationsSent.forEach((record) => {
      expect(record).toHaveProperty('reporterUserId');
      expect(record).toHaveProperty('emailSendingHistoryId');
      expect(record).toHaveProperty('sendingStatus');
      expect(record).toHaveProperty('sentTimestamp');
    });
  });

  it("leaderNotificationsSent が LeaderNotificationRecord[] 型の配列で、空配列であることを確認", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds: [],
    };

    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(Array.isArray(result.leaderNotificationsSent)).toBe(true);
    expect(result.leaderNotificationsSent).toHaveLength(0);
  });

  it("dashboardData が型として正しく取得されていることを確認", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds: [],
    };

    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData).toHaveProperty('submittedReportCount');
    expect(result.dashboardData).toHaveProperty('nonSubmittedReporterCount');
    expect(result.dashboardData).toHaveProperty('nonSubmittedReporters');
    expect(result.dashboardData).toHaveProperty('promptNotificationStatus');
  });

  it("executionTimestamp が number型の有効なUnixタイムスタンプ（ミリ秒）であることを確認", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds: [],
    };

    const mockAiClient: Tx2Imp1AiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(typeof result.executionTimestamp).toBe('number');
    expect(result.executionTimestamp).toBeGreaterThan(0);
  });
});
