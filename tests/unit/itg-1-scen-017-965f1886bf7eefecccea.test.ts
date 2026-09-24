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

describe("SCEN-017: 提出期限に達していない対象日付で実行した場合、SubmissionDeadlineNotReachedエラーで拒否される", () => {
  const targetDate = "2025-01-15";
  const executionTimestamp = 1736913600000; // 日報提出期限より前のUnixタイムスタンプ（ミリ秒）
  const leaderUserIds = ["leader-001"];

  beforeEach(() => {
    jest.clearAllMocks();

    const error = new Error("日報提出期限に達していないため、監視を実行できません。");
    (error as any).name = "SubmissionDeadlineNotReached";
    (judgeSchedulerExecutionTiming as jest.Mock).mockRejectedValue(error);
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
    expect((thrown as any).name).toBe("SubmissionDeadlineNotReached");
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
