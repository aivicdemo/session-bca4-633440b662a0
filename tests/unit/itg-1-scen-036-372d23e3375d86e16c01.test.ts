import {
  runTx3Imp1Agent,
  PromptNotificationFailure,
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

const targetDate = "2025-01-15";
const executionTimestamp = 1705276800000;
const leaderUserIds = ["leader-001"];

const detectionLogId = "log-001";
const detectionDateTime = new Date().toISOString();
const nonSubmittedUserIds = ["user-002", "user-003"];

const nonSubmittedReporters = nonSubmittedUserIds.map((userId, index) => ({
  userId,
  userName: `報告者${index + 2}`,
  emailAddress: `${userId}@example.com`,
  promptPriority: "medium",
}));

describe("SCEN-036: 催促メール送信に失敗した場合でもダッシュボードデータが生成され、未送信フラグが立てられる", () => {
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
        detectionDateTime,
        totalReportersCount: 5,
        nonSubmittedCount: nonSubmittedReporters.length,
        submittedCount: 3,
      },
      detectionTimestamp: detectionDateTime,
    });

    (generateNonSubmissionDetectionResult as jest.Mock).mockResolvedValue({
      dashboardDisplayData: {
        nonSubmittedReportersForDisplay: nonSubmittedReporters,
        detectionLogForDisplay: {
          detectionLogId,
          targetDate,
          detectionDateTime,
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
      promptPriority: "medium",
      promptMethod: "email",
      estimatedNonSubmissionReason: "input_forgotten",
      suggestedPromptMessage: "催促を推奨します。",
      overdueDurationMinutes: 30,
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "NOTIF-PROMPT-036",
      sentAt: new Date(),
      deliveryMethod: "email",
      nonSubmittedReporterCount: nonSubmittedReporters.length,
      errorDetails: null,
    });

    (sendNonSubmissionPromptNotification as jest.Mock).mockRejectedValue(
      new PromptNotificationFailure(
        "未提出者への催促メール送信に失敗しました。"
      )
    );

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue({
      dailyReports: [],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: detectionDateTime,
    });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReports: [],
      nonSubmittedReporters: nonSubmittedReporters.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        emailAddress: r.emailAddress,
        promptSent: false,
      })),
      detectionLogs: [
        {
          detectionLogId,
          targetDate,
          detectionTimestamp: executionTimestamp,
          nonSubmittedCount: nonSubmittedReporters.length,
        },
      ],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 5,
        submittedCount: 3,
        nonSubmittedCount: nonSubmittedReporters.length,
        reminderSentCount: 0,
        submissionRate: 60,
      },
    });
  });

  it("催促メール送信が失敗してもダッシュボードデータが生成され、未提出者に通知未送信フラグが立てられる", async () => {
    const result = await runTx3Imp1Agent({
      targetDate,
      executionTimestamp,
      leaderUserIds,
    });

    expect(result.executionStatus).toBe("partial_failure");

    expect(result.detectionResult).toBeDefined();
    expect(result.detectionResult.detectionLogId).toBe(detectionLogId);

    expect(result.leaderNotificationStatus.length).toBeGreaterThan(0);
    for (const status of result.leaderNotificationStatus) {
      expect(status.sendStatus).toBe("success");
    }

    expect(result.promptNotificationStatus.length).toBeGreaterThan(0);
    for (const status of result.promptNotificationStatus) {
      expect(status.sendStatus).toBe("failed");
      expect(status.errorMessage).toBe(
        "未提出者への催促メール送信に失敗しました。"
      );
    }

    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData.nonSubmittedReporters.length).toBeGreaterThan(
      0
    );
    for (const reporter of result.dashboardData.nonSubmittedReporters) {
      expect(reporter.promptSent).toBe(false);
    }

    expect(typeof result.executionTimestamp).toBe("number");
  });
});
