import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import { judgeSchedulerExecutionTiming } from "../../src/logic/business-day-deadline-judgment";
import { getActiveReportersForSubmissionCheck } from "../../src/logic/reporter-master-management";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";
import { judgePromptNecessityAndMethod } from "../../src/logic/non-submission-prompt-decision";
import { sendLeaderNonSubmissionPromptNotification } from "../../src/logic/daily-report-reminder-notification";
import { retrieveNonSubmissionDetectionLogsByDate } from "../../src/logic/daily-report-persistence";

jest.mock("../../src/logic/business-day-deadline-judgment");
jest.mock("../../src/logic/reporter-master-management");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/non-submission-prompt-decision");
jest.mock("../../src/logic/daily-report-reminder-notification");
jest.mock("../../src/logic/daily-report-persistence");

describe("SCEN-060: リーダーへの検知結果通知が正常に送信されてフラグが真で記録される", () => {
  const targetDate = "2024-01-15";
  const executionContext = {
    scheduledAt: "2024-01-15T17:30:00Z",
    executedBy: "scheduler-001",
  };

  const activeReporters = ["U001", "U002", "U003", "U004", "U005"].map(
    (userId, idx) => ({
      reporterId: `R00${idx + 1}`,
      userId,
      reporterName: `報告者${idx + 1}`,
      emailAddress: `${userId.toLowerCase()}@example.com`,
      department: "営業部",
      status: "active",
    })
  );

  const nonSubmittedReporters = [
    {
      userId: "U004",
      userName: "報告者4",
      emailAddress: "u004@example.com",
      promptPriority: "high",
    },
    {
      userId: "U005",
      userName: "報告者5",
      emailAddress: "u005@example.com",
      promptPriority: "medium",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
    });

    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporters,
      detectionLog: {
        detectionLogId: "det-log-20240115-001",
        targetDate,
        detectionDateTime: "2024-01-15T17:30:05Z",
        totalReportersCount: activeReporters.length,
        nonSubmittedCount: nonSubmittedReporters.length,
      },
      detectionTimestamp: "2024-01-15T17:30:05Z",
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      isPromptNecessary: true,
      promptPriority: "high",
      promptMethod: "email",
      estimatedNonSubmissionReason: "business_busy",
      suggestedPromptMessage: "提出期限を過ぎています。ご確認ください。",
      overdueDurationMinutes: 30,
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "notif-20240115-001",
      sentAt: new Date("2024-01-15T17:31:00Z"),
      deliveryMethod: "email",
      nonSubmittedReporterCount: nonSubmittedReporters.length,
      errorDetails: null,
    });

    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue({
      detectionLogs: nonSubmittedReporters.map((reporter) => ({
        detectionLogId: "det-log-20240115-001",
        userId: reporter.userId,
        targetDate,
        detectionDateTime: "2024-01-15T17:30:05Z",
        reminderSent: true,
        reminderSentDateTime: "2024-01-15T17:31:00Z",
        submissionStatus: "not_submitted" as const,
      })),
      totalCount: nonSubmittedReporters.length,
      retrievedAt: "2024-01-15T17:32:00Z",
    });
  });

  it("leaderNotificationSent が true で、検知ログIDにより本実行が一意に特定できる状態で記録される", async () => {
    const result = await runTx5Imp1Agent({
      targetDate,
      executionContext,
    }, {} as any);

    expect(result.leaderNotificationSent).toBe(true);

    expect(typeof result.detectionLogId).toBe("string");
    expect(result.detectionLogId.length).toBeGreaterThan(0);

    expect(["success", "partial_failure"]).toContain(result.executionStatus);

    if (result.errorDetails !== undefined && result.errorDetails !== null) {
      expect(Array.isArray(result.errorDetails)).toBe(true);
      expect(result.errorDetails.length).toBe(0);
    }

    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
    expect(result.promptNotificationsSent.length).toBeGreaterThan(0);
    for (const notification of result.promptNotificationsSent) {
      expect(notification.status).toBe("success");
    }

    const scheduledAtTime = new Date(executionContext.scheduledAt).getTime();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    for (const reporter of result.nonSubmittedReporters) {
      expect(new Date(reporter.detectionTime).getTime()).toBeGreaterThanOrEqual(
        scheduledAtTime
      );
    }
  });
});
