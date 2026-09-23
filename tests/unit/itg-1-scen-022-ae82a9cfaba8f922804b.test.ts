import {
  runTx2Imp1Agent,
  LeaderNotificationSendingFailed,
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
} from "../../src/agents/tx-2-imp-1/orchestrator";
import { judgeSchedulerExecutionTiming } from "../../src/logic/business-day-deadline-judgment";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";
import { judgePromptNecessityAndMethod } from "../../src/logic/non-submission-prompt-decision";
import {
  sendLeaderNonSubmissionPromptNotification,
  sendLeaderSubmissionNotification,
} from "../../src/logic/daily-report-reminder-notification";
import { retrieveLeaderDashboardData } from "../../src/logic/daily-report-management-view";

jest.mock("../../src/logic/business-day-deadline-judgment");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/non-submission-prompt-decision");
jest.mock("../../src/logic/daily-report-reminder-notification");
jest.mock("../../src/logic/daily-report-management-view");

describe("SCEN-022: リーダーへの提出状況報告メール送信に失敗した場合、LeaderNotificationSendingFailedエラーでpartial_failureステータスが返される", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ["leader-001", "leader-002"];

  const nonSubmittedReporterIds = ["R010"];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: "営業日の提出期限超過時刻に該当",
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds,
      detectionLogId: "LOG-2024-01-15",
      detectionCount: nonSubmittedReporterIds.length,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      promptRequired: true,
      promptMethod: "email",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue([
      {
        reporterUserId: "R010",
        emailSendingHistoryId: "EMAIL-PROMPT-R010",
        sendingStatus: "success",
        sentTimestamp: executionTimestamp,
      },
    ]);

    (sendLeaderSubmissionNotification as jest.Mock).mockRejectedValue(
      new LeaderNotificationSendingFailed(
        "リーダーへの報告メール送信に失敗しました。"
      )
    );

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 4,
      nonSubmittedReporterCount: 1,
      nonSubmittedReporters: [],
      promptNotificationStatus: { sent: 1, failed: 0 },
    });
  });

  it("リーダーへの報告メール送信が失敗し、executionStatusがpartial_failureに降格しleaderNotificationsSentが空配列になる", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_failure");

    expect(result.leaderNotificationsSent).toEqual([]);

    // 設計上の Tx2Imp1AgentOutput にはエラー名（LeaderNotificationSendingFailed）・
    // エラー文言（リーダーへの報告メール送信に失敗しました。）を格納するフィールドが定義されて
    // いないため、戻り値からこれらの値そのものは検証できない（.aivic/batches/30/unresolved.md 参照）。

    expect(result.detectionResult).toBeTruthy();
    expect(result.promptNotificationsSent).toHaveLength(1);
    expect(result.dashboardData).toBeTruthy();
  });
});
