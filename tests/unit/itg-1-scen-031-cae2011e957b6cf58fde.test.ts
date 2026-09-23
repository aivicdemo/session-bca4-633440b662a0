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

const nonSubmittedReporterIds = ["U201", "U202"];

describe("SCEN-031: 未提出者への催促メール送信に失敗し、PromptNotificationFailureが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds,
      detectionCount: nonSubmittedReporterIds.length,
    });

    (generateNonSubmissionDetectionResult as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds,
      detectionLogId: "DET-LOG-20240115-002",
      detectionCount: nonSubmittedReporterIds.length,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      isPromptNecessary: true,
      promptMethod: "email_notification",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue([
      {
        recipientUserId: "leader001",
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: "EMAIL-LEADER-001",
        errorMessage: null,
      },
      {
        recipientUserId: "leader002",
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: "EMAIL-LEADER-002",
        errorMessage: null,
      },
    ]);

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue([]);

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 0,
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      nonSubmittedReporters: nonSubmittedReporterIds.map((reporterId) => ({
        reporterId,
      })),
      promptNotificationStatus: { sent: 0, failed: 0 },
    });

    // ネットワークタイムアウト等、外部メール送信サービス側のエラーによる催促メール送信失敗を再現する。
    (sendNonSubmissionPromptNotification as jest.Mock).mockRejectedValue(
      new Error("ネットワークタイムアウトにより外部メール送信サービスへの接続に失敗しました。")
    );
  });

  it("PromptNotificationFailureがスローされ、sendNonSubmissionPromptNotificationが呼び出される", async () => {
    const input = {
      targetDate: "2024-01-15",
      executionTimestamp: 1705276800000,
      leaderUserIds: ["leader001", "leader002"],
    };

    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      PromptNotificationFailure
    );
    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      "未提出者への催促メール送信に失敗しました。"
    );

    expect(sendNonSubmissionPromptNotification).toHaveBeenCalled();
  });
});
