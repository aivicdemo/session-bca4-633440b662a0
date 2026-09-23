import {
  runTx3Imp1Agent,
  SchedulerExecutionTimingError,
} from "../../src/agents/tx-3-imp-1/orchestrator";
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

describe("SCEN-027: 定時スケジューラの実行タイミング判定に失敗し、SchedulerExecutionTimingErrorが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockRejectedValue(
      new SchedulerExecutionTimingError("定時スケジューラの実行タイミング判定に失敗しました。")
    );
  });

  it("SchedulerExecutionTimingErrorがスローされ、以降の処理は一切呼び出されない", async () => {
    const input = {
      targetDate: "2024-01-15",
      executionTimestamp: 1705276800000,
      leaderUserIds: ["leader001"],
    };

    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      SchedulerExecutionTimingError
    );
    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      "定時スケジューラの実行タイミング判定に失敗しました。"
    );

    expect(detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });
});
