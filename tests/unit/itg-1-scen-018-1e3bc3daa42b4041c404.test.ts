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

// タイトルは「対象日付にアクティブな報告者が存在しない場合、NoActiveReportersFoundエラーで拒否される」だが、
// 手順・期待結果はいずれも judgeSchedulerExecutionTiming が「提出期限に達していない」ことを返した場合に
// SubmissionDeadlineNotReached エラーで拒否されることを検証する内容になっている。
// タイトルと手順・期待結果の不一致については .aivic/batches/30/unresolved.md に記録し、
// 手順・期待結果の記述に最も忠実な検証を実施する。
describe("SCEN-018: 提出期限に達していない対象日付で実行した場合、SubmissionDeadlineNotReachedエラーで拒否される", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ["leader-001"];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: false,
      isBusinessDay: true,
      isWithinExecutionWindow: false,
      nextScheduledExecutionTime: 1705320000000,
      executionReason: "日報提出期限に達していない",
    });
  });

  it("SubmissionDeadlineNotReachedエラーを発生させ、以降の処理を一切実行しない", async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    let thrown: unknown;
    const mockAiClient = {};
    try {
      await runTx2Imp1Agent(input, mockAiClient);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect((thrown as Error).message).toBe(
      "日報提出期限に達していないため、監視を実行できません。"
    );

    expect(detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(sendLeaderSubmissionNotification).not.toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });
});
