import {
  runTx3Imp1Agent,
  LeaderNotificationFailure,
} from "../../src/agents/tx-3-imp-1/orchestrator";
import { judgeSchedulerExecutionTiming } from "../../src/logic/business-day-deadline-judgment";
import {
  detectNonSubmittedReportersAtDeadline,
  generateNonSubmissionDetectionResult,
} from "../../src/logic/daily-report-non-submission-detection";
import { judgePromptNecessityAndMethod } from "../../src/logic/non-submission-prompt-decision";
import { sendLeaderNonSubmissionPromptNotification } from "../../src/logic/daily-report-reminder-notification";
import { sendNonSubmissionPromptNotification } from "../../src/logic/email-notification-management";

jest.mock("../../src/logic/business-day-deadline-judgment");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/non-submission-prompt-decision");
jest.mock("../../src/logic/daily-report-reminder-notification");
jest.mock("../../src/logic/email-notification-management");

describe("SCEN-029: リーダーへの通知送信に失敗し、LeaderNotificationFailureが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(true);

    // 仕様の手順どおり、detectNonSubmittedReportersAtDeadline のスタブに
    // LeaderNotificationFailure をスローさせる（SCEN-029の前提条件を参照）。
    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockRejectedValue(
      new LeaderNotificationFailure("リーダーへの通知送信に失敗しました。")
    );
  });

  it("LeaderNotificationFailureがスローされ、以降の処理は呼び出されない", async () => {
    const input = {
      targetDate: "2024-01-15",
      executionTimestamp: 1705276800000,
      leaderUserIds: ["leader-001", "leader-002"],
    };

    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      LeaderNotificationFailure
    );
    await expect(runTx3Imp1Agent(input)).rejects.toThrow(
      "リーダーへの通知送信に失敗しました。"
    );

    expect(generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
