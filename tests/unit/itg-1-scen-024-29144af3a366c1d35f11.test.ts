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

describe("SCEN-024: 複数のリーダーユーザーIDが指定された場合、全リーダーに提出状況報告メールが送信される", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705309200000;
  const leaderUserIds = ["leader-001", "leader-002", "leader-003"];

  const nonSubmittedReporterIds = ["R030", "R031"];

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

    (sendLeaderSubmissionNotification as jest.Mock)
      .mockResolvedValueOnce({
        leaderUserId: "leader-001",
        emailSendingHistoryId: "EMAIL-LEADER-001",
        sendingStatus: "success",
        sentTimestamp: executionTimestamp,
      })
      .mockResolvedValueOnce({
        leaderUserId: "leader-002",
        emailSendingHistoryId: "EMAIL-LEADER-002",
        sendingStatus: "success",
        sentTimestamp: executionTimestamp,
      })
      .mockResolvedValueOnce({
        leaderUserId: "leader-003",
        emailSendingHistoryId: "EMAIL-LEADER-003",
        sendingStatus: "success",
        sentTimestamp: executionTimestamp,
      });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 3,
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      nonSubmittedReporters: [],
      promptNotificationStatus: { sent: 2, failed: 0 },
    });
  });

  it("leaderUserIds配列の全リーダー分のLeaderNotificationRecordが生成される", async () => {
    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input);

    expect(result.executionStatus).toBe("success");
    expect(result.leaderNotificationsSent).toHaveLength(leaderUserIds.length);

    const notifiedLeaderUserIds = result.leaderNotificationsSent.map(
      (record: any) => record.leaderUserId
    );
    expect(notifiedLeaderUserIds).toEqual(
      expect.arrayContaining(leaderUserIds)
    );

    expect(result.targetDate).toBe(targetDate);
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
  });
});
