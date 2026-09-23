import {
  runTx3Imp1Agent,
  DetectionLogRecordingFailure,
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

const nonSubmittedReporterIds = ["U301", "U302", "U303", "U304", "U305"];

describe("SCEN-032: 未提出者検知ログの記録に失敗し、DetectionLogRecordingFailureが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds,
      detectionCount: nonSubmittedReporterIds.length,
    });

    (generateNonSubmissionDetectionResult as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds,
      detectionLogId: "det-log-20240115-001",
      detectionDateTime: 1705276800000,
      detectionCount: nonSubmittedReporterIds.length,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      isPromptNecessary: true,
      promptMethod: "email_notification",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue([
      {
        recipientUserId: "leader-001",
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: "EMAIL-LEADER-001",
        errorMessage: null,
      },
      {
        recipientUserId: "leader-002",
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: "EMAIL-LEADER-002",
        errorMessage: null,
      },
    ]);

    // sendNonSubmissionPromptNotification の内部で検知ログの記録処理が失敗する。
    (sendNonSubmissionPromptNotification as jest.Mock).mockRejectedValue(
      new DetectionLogRecordingFailure("検知ログの記録に失敗しました。")
    );

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue([]);

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 0,
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      nonSubmittedReporters: nonSubmittedReporterIds.map((reporterId) => ({
        reporterId,
      })),
      promptNotificationStatus: { sent: 0, failed: 0 },
    });
  });

  it("DetectionLogRecordingFailureがスローされ、Tx3Imp1AgentOutputは返されない", async () => {
    const input = {
      targetDate: "2024-01-15",
      executionTimestamp: 1705276800000,
      leaderUserIds: ["leader-001", "leader-002"],
    };

    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      DetectionLogRecordingFailure
    );
    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      "検知ログの記録に失敗しました。"
    );

    expect(retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });
});
