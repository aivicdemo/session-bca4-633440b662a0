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

describe("SCEN-025: リーダーユーザーID配列が空の場合、提出状況報告メール送信レコードが空で実行完了する", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705309200000;
  const leaderUserIds: string[] = [];

  const nonSubmittedReporterIds = ["R040"];

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
        reporterUserId: "R040",
        emailSendingHistoryId: "EMAIL-PROMPT-R040",
        sendingStatus: "success",
        sentTimestamp: executionTimestamp,
      },
    ]);

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue({
      leaderUserId: "unused",
      emailSendingHistoryId: "EMAIL-LEADER-UNUSED",
      sendingStatus: "success",
      sentTimestamp: executionTimestamp,
    });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 0,
      nonSubmittedReporterCount: 1,
      nonSubmittedReporters: [],
      promptNotificationStatus: { sent: 1, failed: 0 },
    });
  });

  it("leaderUserIdsが空配列の場合、leaderNotificationsSentが空配列で他のフィールドは正常に埋まる", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input);

    expect(result.executionStatus).toBe("success");
    expect(result.targetDate).toBe("2024-01-15");

    expect(result.detectionResult).toBeTruthy();

    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
    expect(result.promptNotificationsSent.length).toBeGreaterThanOrEqual(1);

    expect(result.leaderNotificationsSent).toEqual([]);
    expect(sendLeaderSubmissionNotification).not.toHaveBeenCalled();

    expect(result.dashboardData).toBeTruthy();
    expect(typeof result.executionTimestamp).toBe("number");
  });
});
