import {
  runTx2Imp1Agent,
  DetectionLogRecordingFailed,
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

describe("SCEN-019: 未提出者検知ログ記録に失敗した場合、DetectionLogRecordingFailedエラーでpartial_failureステータスが返される", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705315200000; // 2024-01-15 09:00:00 UTC
  const leaderUserIds = ["leader001"];

  const nonSubmittedReporterIds = ["R001", "R002", "R003"];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: "営業日の提出期限超過時刻に該当",
    });

    // detectNonSubmittedReportersAtDeadline は複数の未提出者を検知した上で、
    // その内部処理である検知ログの記録に失敗した状態を、DetectionLogRecordingFailed
    // エラー（検知済みの未提出者情報を保持したまま）として再現する。
    const detectionError = new DetectionLogRecordingFailed(
      "未提出者検知ログの記録に失敗しました。"
    );
    (detectionError as any).nonSubmittedReporterIds = nonSubmittedReporterIds;
    (detectionError as any).detectionCount = nonSubmittedReporterIds.length;
    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockRejectedValue(
      detectionError
    );

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      promptRequired: true,
      promptMethod: "email",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      []
    );

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue({
      leaderUserId: "leader001",
      emailSendingHistoryId: "EMAIL-LEADER001",
      sendingStatus: "success",
      sentTimestamp: executionTimestamp,
    });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 0,
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      nonSubmittedReporters: [],
      promptNotificationStatus: { sent: 0, failed: 0 },
    });
  });

  it("executionStatusがpartial_failureとなり、検知済みの未提出者情報を保持したまま処理を継続する", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_failure");
    expect(result.targetDate).toBe("2024-01-15");

    expect(result.detectionResult).toBeTruthy();
    expect(
      result.detectionResult.detectionCount ??
        result.detectionResult.nonSubmittedReporterIds?.length
    ).toBe(nonSubmittedReporterIds.length);

    // 「promptNotificationsSentおよびleaderNotificationsSentフィールドが空配列または
    // 部分的な送信記録であること」との記述に合わせ、配列であることのみを検証する。
    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
    expect(Array.isArray(result.leaderNotificationsSent)).toBe(true);

    expect(typeof result.executionTimestamp).toBe("number");

    // 設計上の Tx2Imp1AgentOutput にはエラー名・エラー文言を格納するフィールドが定義されて
    // いないため、DetectionLogRecordingFailed のエラー名・文言そのものは戻り値からは検証できない
    // （.aivic/batches/30/unresolved.md 参照）。
  });
});
