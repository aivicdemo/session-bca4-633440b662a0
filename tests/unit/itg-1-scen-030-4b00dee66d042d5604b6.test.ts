import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
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

// 退職済み社員Aを含む、人事異動が未反映の古い報告者マスタ（本来のチームメンバーはB〜Fの5名）。
const staleMasterReporterIds = ["A-retired", "B", "C", "D", "E", "F"];

describe("SCEN-030: 報告者マスタの登録・更新・削除が必要な人事異動状況下で、マスタが古い状態のまま未提出者検知が実行される", () => {
  const targetDate = new Date().toISOString().slice(0, 10);
  const executionTimestamp = Date.now();
  const leaderUserIds = ["leader-001"];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      executionReason: "定時実行タイミングとして妥当",
    });

    // 古いマスタ（退職社員Aを含む6人）に基づいて未提出者検知が実行される。
    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds: staleMasterReporterIds,
      detectionCount: staleMasterReporterIds.length,
    });

    (generateNonSubmissionDetectionResult as jest.Mock).mockResolvedValue({
      nonSubmittedReporterIds: staleMasterReporterIds,
      detectionLogId: "DET-LOG-STALE-MASTER-001",
      detectionCount: staleMasterReporterIds.length,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockResolvedValue({
      isPromptNecessary: true,
      promptMethod: "email_notification",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      staleMasterReporterIds.map((reporterId) => ({
        recipientUserId: reporterId,
        notificationType: "leader_notification",
        sendStatus: "success",
        emailSendingHistoryId: `EMAIL-LEADER-${reporterId}`,
        errorMessage: null,
      }))
    );

    (sendNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      staleMasterReporterIds.map((reporterId) => ({
        recipientUserId: reporterId,
        notificationType: "prompt_notification",
        sendStatus: "success",
        emailSendingHistoryId: `EMAIL-PROMPT-${reporterId}`,
        errorMessage: null,
      }))
    );

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue([]);

    // dashboardData には人事異動不整合の警告フラグ・マスタ更新促進メッセージを含めない
    // （誤った検知結果がそのまま表示される想定）。
    (retrieveLeaderDashboardData as jest.Mock).mockResolvedValue({
      submittedReportCount: 0,
      nonSubmittedReporterCount: staleMasterReporterIds.length,
      nonSubmittedReporters: staleMasterReporterIds.map((reporterId) => ({
        reporterId,
      })),
      promptNotificationStatus: {
        sent: staleMasterReporterIds.length,
        failed: 0,
      },
    });
  });

  it("退職社員Aが誤って未提出者として検知され、executionStatusがpartial_failureとなる", async () => {
    const result = await runTx3Imp1Agent({
      targetDate,
      executionTimestamp,
      leaderUserIds,
    });

    expect(result.executionStatus).toBe("partial_failure");

    expect(result.detectionResult.nonSubmittedReporterIds).toContain(
      "A-retired"
    );

    expect(result.leaderNotificationStatus).toHaveLength(6);
    expect(result.promptNotificationStatus).toHaveLength(6);

    expect(result.dashboardData.warningFlag).toBeUndefined();
    expect(result.dashboardData.masterUpdateRequired).toBeUndefined();
  });
});
