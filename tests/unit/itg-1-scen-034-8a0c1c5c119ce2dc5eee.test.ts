import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
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

const nonSubmittedReporterIds = ["U401", "U402", "U403", "U404", "U405"];

describe("SCEN-034: 複数のリーダーに対して通知が個別に送信され、各リーダーのステータスが記録される", () => {
  const executionTimestamp = 1705324800000;
  const leaderUserIds = ["leader-001", "leader-002", "leader-003"];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      executionReason: "定時実行タイミングとして妥当",
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds,
      detectionCount: nonSubmittedReporterIds.length,
    });

    (generateNonSubmissionDetectionResult as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds,
      detectionLogId: "DET-LOG-20250115-001",
      detectionCount: nonSubmittedReporterIds.length,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      isPromptNecessary: true,
      promptMethod: "email_notification",
    });

    // 各リーダーへの通知は個別に送信され、送信タイムスタンプはそれぞれ異なる。
    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      leaderUserIds.map((leaderUserId, index) => ({
        recipientUserId: leaderUserId,
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: `EMAIL-LEADER-${leaderUserId}`,
        errorMessage: null,
        sentAt: executionTimestamp + 1000 * (index + 1),
      }))
    );

    (sendNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      nonSubmittedReporterIds.map((reporterId) => ({
        recipientUserId: reporterId,
        notificationType: "prompt_notification",
        sendStatus: "success",
        emailSendingHistoryId: `EMAIL-PROMPT-${reporterId}`,
        errorMessage: null,
      }))
    );

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue(
      nonSubmittedReporterIds.map((reporterId) => ({
        reporterId,
        submissionStatus: "not_submitted",
      }))
    );

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 0,
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      nonSubmittedReporters: nonSubmittedReporterIds.map((reporterId) => ({
        reporterId,
      })),
      promptNotificationStatus: {
        sent: nonSubmittedReporterIds.length,
        failed: 0,
      },
    });
  });

  it("leaderNotificationStatusが3件で、各要素が異なるタイムスタンプでsuccessを記録する", async () => {
    const result = await runTx3Imp1Agent({
      targetDate: "2025-01-15",
      executionTimestamp,
      leaderUserIds,
    });

    expect(result.executionStatus).toBe("success");
    expect(result.detectionResult.nonSubmittedReporterIds).toHaveLength(5);
    expect(result.detectionResult.detectionLogId).toBe("DET-LOG-20250115-001");

    expect(Array.isArray(result.leaderNotificationStatus)).toBe(true);
    expect(result.leaderNotificationStatus).toHaveLength(3);

    const [status0, status1, status2] = result.leaderNotificationStatus;

    expect(status0.sendStatus).toBe("success");
    expect(status0.sentAt).toBeGreaterThan(executionTimestamp);

    expect(status1.sendStatus).toBe("success");
    expect(status1.sentAt).toBeGreaterThan(executionTimestamp);
    expect(status1.sentAt).not.toBe(status0.sentAt);

    expect(status2.sendStatus).toBe("success");
    expect(status2.sentAt).toBeGreaterThan(executionTimestamp);
    expect(status2.sentAt).not.toBe(status0.sentAt);
    expect(status2.sentAt).not.toBe(status1.sentAt);

    expect(Array.isArray(result.promptNotificationStatus)).toBe(true);
    expect(result.promptNotificationStatus).toHaveLength(5);

    expect(result.dashboardData).toBeDefined();

    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
  });
});
