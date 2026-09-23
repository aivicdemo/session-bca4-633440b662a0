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

const nonSubmittedReporterIds = ["U101", "U102", "U103"];

describe("SCEN-026: 代表的な正常入力で未提出者検知・リーダー通知・催促メール送信がすべて完了する", () => {
  const executionTimestamp = 1705324800000;
  const leaderUserIds = ["leader-001", "leader-002"];

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
      detectionLogId: "DET-LOG-20240115-001",
      detectionCount: nonSubmittedReporterIds.length,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      isPromptNecessary: true,
      promptMethod: "email_notification",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      leaderUserIds.map((leaderUserId) => ({
        recipientUserId: leaderUserId,
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: `EMAIL-LEADER-${leaderUserId}`,
        errorMessage: null,
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

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue([
      { reporterId: "U201", submissionStatus: "submitted" },
      { reporterId: "U101", submissionStatus: "not_submitted" },
    ]);

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 2,
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      nonSubmittedReporters: nonSubmittedReporterIds.map((reporterId) => ({
        reporterId,
      })),
      promptNotificationStatus: { sent: nonSubmittedReporterIds.length, failed: 0 },
    });
  });

  it("executionStatus='success'で未提出者検知・リーダー通知・催促メール送信の各結果を含むTx3Imp1AgentOutputが返る", async () => {
    const input = {
      targetDate: "2024-01-15",
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input);

    expect(result.executionStatus).toBe("success");

    expect(result.detectionResult).toBeDefined();
    expect(typeof result.detectionResult).toBe("object");
    expect(result.detectionResult.detectionLogId).toBe("DET-LOG-20240115-001");
    expect(result.detectionResult.detectionCount).toBe(3);

    expect(Array.isArray(result.leaderNotificationStatus)).toBe(true);
    expect(result.leaderNotificationStatus).toHaveLength(2);
    for (const status of result.leaderNotificationStatus) {
      expect(status.sendStatus).toBe("success");
    }

    expect(Array.isArray(result.promptNotificationStatus)).toBe(true);
    expect(result.promptNotificationStatus).toHaveLength(3);
    for (const status of result.promptNotificationStatus) {
      expect(status.sendStatus).toBe("success");
    }

    expect(result.dashboardData).toBeDefined();
    expect(typeof result.dashboardData).toBe("object");

    expect(typeof result.executionTimestamp).toBe("number");
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
    expect(result.executionTimestamp).toBeLessThanOrEqual(Date.now());
  });
});
