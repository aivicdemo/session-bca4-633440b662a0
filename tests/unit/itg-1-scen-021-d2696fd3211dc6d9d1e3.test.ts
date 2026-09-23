import {
  runTx2Imp1Agent,
  PromptNotificationSendingFailed,
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

describe("SCEN-021: 未提出者への催促メール送信に失敗した場合、PromptNotificationSendingFailedエラーでpartial_failureステータスが返される", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705310400000;
  const leaderUserIds = ["leader1"];

  const nonSubmittedReporterIds = ["U1", "U2", "U3"];

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

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockRejectedValue(
      new PromptNotificationSendingFailed("催促メール送信に失敗しました。")
    );

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue({
      leaderUserId: "leader1",
      emailSendingHistoryId: "EMAIL-LEADER1",
      sendingStatus: "success",
      sentTimestamp: executionTimestamp,
    });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 0,
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      nonSubmittedReporters: [],
      promptNotificationStatus: { sent: 0, failed: nonSubmittedReporterIds.length },
    });
  });

  it("催促メール送信が失敗し、executionStatusがpartial_failureとなりpromptNotificationsSentが空配列になる", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_failure");
    expect(result.targetDate).toBe("2024-01-15");

    expect(
      result.detectionResult.detectionCount ??
        result.detectionResult.nonSubmittedReporterIds?.length
    ).toBe(3);

    expect(result.promptNotificationsSent).toEqual([]);

    // 設計上の Tx2Imp1AgentOutput にはエラー名（PromptNotificationSendingFailed）・
    // エラー文言（催促メール送信に失敗しました。）を格納するフィールドが定義されていないため、
    // 戻り値からこれらの値そのものを検証することはできない（.aivic/batches/30/unresolved.md 参照）。
    expect(result.dashboardData).toBeTruthy();
    expect(Array.isArray(result.leaderNotificationsSent)).toBe(true);
  });
});
