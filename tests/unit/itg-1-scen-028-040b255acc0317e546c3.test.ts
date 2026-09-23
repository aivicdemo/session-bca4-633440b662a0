import {
  runTx3Imp1Agent,
  NonSubmissionDetectionFailure,
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

describe("SCEN-028: 未提出者検知処理が失敗し、NonSubmissionDetectionFailureが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      executionReason: "定時実行タイミングとして妥当",
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockRejectedValue(
      new NonSubmissionDetectionFailure("未提出者の検知に失敗しました。")
    );
  });

  it("NonSubmissionDetectionFailureがスローされ、以降の処理は呼び出されない", async () => {
    const input = {
      targetDate: "2024-01-15",
      executionTimestamp: 1705276800000,
      leaderUserIds: ["leader-001", "leader-002"],
    };

    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      NonSubmissionDetectionFailure
    );
    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      "未提出者の検知に失敗しました。"
    );

    expect(generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });
});
