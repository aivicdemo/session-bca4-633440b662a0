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

describe("SCEN-020: 提出期限に達した対象日付で、一部の報告者が未提出の場合、検知結果に未提出者が含まれ、催促メール送信レコードが生成される", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705309200000;
  const leaderUserIds = ["leader-001", "leader-002"];

  const nonSubmittedReporterIds = ["R004", "R005"];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: "営業日の提出期限超過時刻に該当",
    });

    // NonSubmissionDetectionResult は nonSubmittedReporterIds（ユーザーID配列）のみを
    // 持つ設計であり、氏名を格納するフィールドは定義されていない
    // （.aivic/batches/30/unresolved.md 参照）。
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
      });

    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 3,
      nonSubmittedReporterCount: 2,
      nonSubmittedReporters: nonSubmittedReporterIds.map((userId) => ({
        userId,
        userName: `報告者${userId}`,
        emailAddress: `${userId.toLowerCase()}@example.com`,
        promptSent: true,
      })),
      promptNotificationStatus: { sent: 2, failed: 0 },
    });
  });

  it("未提出者2名が検知され、催促メール送信レコードとリーダー全員への報告メール送信レコードが生成される", async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const mockAiClient = {};
    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe("success");

    expect(result.detectionResult.nonSubmittedReporterIds).toEqual(
      expect.arrayContaining(nonSubmittedReporterIds)
    );
    expect(result.detectionResult.nonSubmittedReporterIds).toHaveLength(2);

    expect(result.promptNotificationsSent).toHaveLength(2);
    result.promptNotificationsSent.forEach((record: any) => {
      expect(nonSubmittedReporterIds).toContain(record.reporterUserId);
      expect(record.sentTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
      expect(record.sendingStatus).toBe("success");
    });

    expect(result.leaderNotificationsSent).toHaveLength(leaderUserIds.length);

    expect(result.dashboardData.submittedReportCount).toBe(3);
    expect(result.dashboardData.nonSubmittedReporterCount).toBe(2);

    expect(result.targetDate).toBe(targetDate);
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
  });
});
