import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
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

describe("SCEN-023: 管理画面表示用ダッシュボードデータ取得に失敗した場合、DashboardDataRetrievalFailedエラーでpartial_failureステータスが返される", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705305600000;
  const leaderUserIds = ["leader001"];

  const nonSubmittedReporterIds = ["R020", "R021"];

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

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      nonSubmittedReporterIds.map((reporterUserId, index) => ({
        reporterUserId,
        emailSendingHistoryId: `EMAIL-PROMPT-${index + 1}`,
        sendingStatus: "success",
        sentTimestamp: executionTimestamp,
      }))
    );

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue({
      leaderUserId: "leader001",
      emailSendingHistoryId: "EMAIL-LEADER001",
      sendingStatus: "success",
      sentTimestamp: executionTimestamp,
    });

    const error = new Error("管理画面データの取得に失敗しました。");
    (error as any).name = "DashboardDataRetrievalFailed";
    (retrieveLeaderDashboardData as jest.Mock).mockRejectedValue(error);
  });

  it("ダッシュボードデータ取得が失敗し、executionStatusがpartial_failureとなりdashboardDataがnullまたはundefinedになる", async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const mockAiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe("partial_failure");
    expect(result.dashboardData == null).toBe(true);

    expect(result.detectionResult).toBeTruthy();
    expect(
      result.detectionResult.detectionCount ??
        result.detectionResult.nonSubmittedReporterIds?.length
    ).toBe(2);
    expect(result.promptNotificationsSent).toHaveLength(2);
    expect(result.leaderNotificationsSent).toHaveLength(1);

    expect(result.targetDate).toBe("2024-01-15");
    expect(typeof result.executionTimestamp).toBe("number");

    // 設計上の Tx2Imp1AgentOutput にはエラー名（DashboardDataRetrievalFailed）・
    // エラー文言（管理画面データの取得に失敗しました。）を格納するフィールドが定義されて
    // いないため、戻り値からこれらの値そのものは検証できない（.aivic/batches/29/unresolved.md 参照）。
  });
});
