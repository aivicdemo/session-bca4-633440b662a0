import {
  runTx2Imp1Agent,
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

describe("SCEN-016: 提出期限に達した対象日付で、全員が日報を提出済みの場合、成功ステータスで実行完了し、未提出者なし・催促メール送信なし・リーダーに提出状況報告を送信する", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705309200000; // 2024-01-15 18:00:00 +09:00（提出期限超過後）
  const leaderUserIds = ["leader-001"];

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
      nonSubmittedReporterIds: [],
      detectionLogId: "LOG-2024-01-15",
      detectionCount: 0,
    });

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValueOnce({
      leaderUserId: "leader-001",
      emailSendingHistoryId: "EMAIL-LEADER-001",
      sendingStatus: "success",
      sentTimestamp: executionTimestamp,
    });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 5,
      nonSubmittedReporterCount: 0,
      nonSubmittedReporters: [],
      promptNotificationStatus: { sent: 0, failed: 0 },
    });
  });

  it("未提出者がいないため催促メールは送信せず、リーダーへ提出状況報告のみ送信して成功する", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input);

    expect(result.executionStatus).toBe("success");
    expect(result.targetDate).toBe("2024-01-15");

    expect(result.detectionResult.nonSubmittedReporterIds).toEqual([]);
    expect(result.detectionResult.detectionCount).toBe(0);

    expect(result.promptNotificationsSent).toEqual([]);
    // 未提出者がいないため催促必要性判定・催促メール送信は呼び出されない前提
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();

    expect(result.leaderNotificationsSent.length).toBeGreaterThanOrEqual(1);
    expect(
      result.leaderNotificationsSent.some(
        (record: any) => record.leaderUserId === "leader-001"
      )
    ).toBe(true);

    expect(result.dashboardData).toBeTruthy();

    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
  });
});
