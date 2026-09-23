import {
  runTx3Imp1Agent,
  LeaderNotificationFailure,
} from "../../src/agents/tx-3-imp-1/orchestrator";
import { judgeSchedulerExecutionTiming } from "../../src/logic/business-day-deadline-judgment";
import {
  detectNonSubmittedReportersAtDeadline,
  generateNonSubmissionDetectionResult,
} from "../../src/logic/daily-report-non-submission-detection";
import { judgePromptNecessityAndMethod } from "../../src/logic/non-submission-prompt-decision";
import { sendLeaderNonSubmissionPromptNotification } from "../../src/logic/daily-report-reminder-notification";
import { sendNonSubmissionPromptNotification } from "../../src/logic/email-notification-management";
import { retrieveDailyReportsForLeaderReview } from "../../src/logic/daily-report-persistence";
import { retrieveLeaderDashboardData } from "../../src/logic/daily-report-management-view";

jest.mock("../../src/logic/business-day-deadline-judgment");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/non-submission-prompt-decision");
jest.mock("../../src/logic/daily-report-reminder-notification");
jest.mock("../../src/logic/email-notification-management");
jest.mock("../../src/logic/daily-report-persistence");
jest.mock("../../src/logic/daily-report-management-view");

const targetDate = "2024-01-15";
const executionTimestamp = 1705276800000;
const leaderUserIds = ["leader001", "leader002"];

const nonSubmittedReporters = [
  {
    userId: "user001",
    userName: "報告者1",
    emailAddress: "user001@example.com",
    promptPriority: "high",
  },
  {
    userId: "user002",
    userName: "報告者2",
    emailAddress: "user002@example.com",
    promptPriority: "medium",
  },
];

const detectionLogId = "LOG-035";

describe("SCEN-035: リーダー通知に失敗した場合でも未提出者への催促メールが送信される", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: "営業日の実行時刻内",
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporters,
      detectionLog: {
        detectionLogId,
        targetDate,
        detectionDateTime: "2024-01-15T17:00:00+09:00",
        totalReportersCount: 5,
        nonSubmittedCount: nonSubmittedReporters.length,
        submittedCount: 3,
      },
      detectionTimestamp: "2024-01-15T17:00:00+09:00",
    });

    (generateNonSubmissionDetectionResult as jest.Mock).mockResolvedValue({
      dashboardDisplayData: {
        nonSubmittedReportersForDisplay: nonSubmittedReporters,
        detectionLogForDisplay: {
          detectionLogId,
          targetDate,
          detectionDateTime: "2024-01-15T17:00:00+09:00",
        },
        summaryStatistics: {
          nonSubmittedCount: nonSubmittedReporters.length,
          submittedCount: 3,
        },
      },
      promptNotificationData: {
        nonSubmittedReportersForNotification: nonSubmittedReporters,
        notificationContext: {
          targetDate,
          detectionLogId,
        },
      },
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      isPromptNecessary: true,
      promptPriority: "high",
      promptMethod: "email",
      estimatedNonSubmissionReason: "input_forgotten",
      suggestedPromptMessage: "催促を推奨します。",
      overdueDurationMinutes: 60,
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockRejectedValue(
      new LeaderNotificationFailure("リーダーへの通知送信に失敗しました。")
    );

    (sendNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
      totalTargets: nonSubmittedReporters.length,
      successCount: nonSubmittedReporters.length,
      failureCount: 0,
      emailSendingHistoryIds: ["EH-001", "EH-002"],
      sentAt: "2024-01-15T17:01:00+09:00",
      failedReporterIds: null,
      errorMessage: null,
    });

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue({
      dailyReports: [],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: "2024-01-15T17:02:00+09:00",
    });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReports: [],
      nonSubmittedReporters: nonSubmittedReporters.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        emailAddress: r.emailAddress,
        promptSent: true,
      })),
      detectionLogs: [
        {
          detectionLogId,
          targetDate,
          detectionTimestamp: 1705309200000,
          nonSubmittedCount: nonSubmittedReporters.length,
        },
      ],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 5,
        submittedCount: 3,
        nonSubmittedCount: nonSubmittedReporters.length,
        reminderSentCount: nonSubmittedReporters.length,
        submissionRate: 60,
      },
    });
  });

  it("リーダー通知が全件失敗しても未提出者への催促メールは全件送信され、partial_failureとして完結する", async () => {
    const result = await runTx3Imp1Agent({
      targetDate,
      executionTimestamp,
      leaderUserIds,
    });

    expect(result.executionStatus).toBe("partial_failure");

    expect(result.leaderNotificationStatus).toHaveLength(leaderUserIds.length);
    for (const status of result.leaderNotificationStatus) {
      expect(status.sendStatus).toBe("failure");
    }

    expect(result.promptNotificationStatus.length).toBeGreaterThan(0);
    for (const status of result.promptNotificationStatus) {
      expect(status.sendStatus).toBe("success");
    }

    expect(result.detectionResult).toBeDefined();
    expect(result.detectionResult.detectionLogId).toBe(detectionLogId);
    expect(result.detectionResult.nonSubmittedReporterIds).toEqual(
      expect.arrayContaining(nonSubmittedReporters.map((r) => r.userId))
    );
    expect(result.detectionResult.detectionCount).toBe(
      nonSubmittedReporters.length
    );

    expect(result.dashboardData).toBeDefined();
  });
});
