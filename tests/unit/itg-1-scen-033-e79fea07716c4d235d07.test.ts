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

describe("SCEN-033: 未提出者が0件の場合、空の一覧でリーダーに通知される", () => {
  const executionTimestamp = 1704902400000;
  const leaderUserIds = ["leader-001", "leader-002"];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue([]);

    (generateNonSubmissionDetectionResult as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds: [],
      detectionLogId: "DET-LOG-20240110-000",
      detectionCount: 0,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue([]);

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      leaderUserIds.map((leaderUserId) => ({
        recipientUserId: leaderUserId,
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: `EMAIL-LEADER-${leaderUserId}`,
        errorMessage: null,
      }))
    );

    (sendNonSubmissionPromptNotification as jest.Mock).mockResolvedValue([]);

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue([]);

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 5,
      nonSubmittedReporterCount: 0,
      nonSubmittedReporters: [],
      promptNotificationStatus: { sent: 0, failed: 0 },
    });
  });

  it("executionStatus='success'で未提出者0件・催促メール送信なしの結果が返る", async () => {
    const input = {
      targetDate: "2024-01-10",
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input);

    expect(result.executionStatus).toBe("success");
    expect(result.detectionResult.detectionCount).toBe(0);

    expect(result.leaderNotificationStatus).toHaveLength(2);
    for (const status of result.leaderNotificationStatus) {
      expect(status.sendStatus).toBe("success");
    }

    expect(result.promptNotificationStatus).toEqual([]);

    expect(result.dashboardData.nonSubmittedReporterCount).toBe(0);

    expect(result.executionTimestamp).toBeGreaterThan(executionTimestamp);
  });
});
