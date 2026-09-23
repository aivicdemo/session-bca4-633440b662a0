import {
  runTx4Imp1Agent,
  NoActiveReportersFound,
  NonSubmissionDetectionFailed,
} from "../../src/agents/tx-4-imp-1/orchestrator";
import { judgeBusinessDayAndDeadline } from "../../src/logic/business-day-deadline-judgment";
import { getActiveReportersForSubmissionCheck } from "../../src/logic/reporter-master-management";
import { retrieveDailyReportsForLeaderReview } from "../../src/logic/daily-report-persistence";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";
import { judgePromptNecessityAndMethod } from "../../src/logic/non-submission-prompt-decision";
import { sendLeaderNonSubmissionPromptNotification } from "../../src/logic/daily-report-reminder-notification";
import { sendNonSubmissionPromptNotification } from "../../src/logic/email-notification-management";
import { retrieveLeaderDashboardData } from "../../src/logic/daily-report-management-view";

jest.mock("../../src/logic/business-day-deadline-judgment");
jest.mock("../../src/logic/reporter-master-management");
jest.mock("../../src/logic/daily-report-persistence");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/non-submission-prompt-decision");
jest.mock("../../src/logic/daily-report-reminder-notification");
jest.mock("../../src/logic/email-notification-management");
jest.mock("../../src/logic/daily-report-management-view");

describe("SCEN-040: 対象日時点で有効な報告者が存在しない場合、NoActiveReportersFoundエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeBusinessDayAndDeadline as jest.Mock).mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: "2024-01-15T18:00:00+09:00",
      processingPolicy: "accept",
      rejectionReason: null,
    });

    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue({
      success: true,
      reporters: [],
      totalCount: 0,
      message: "対象報告者が見つかりませんでした。",
    });
  });

  it("NoActiveReportersFoundエラーが発生し、後続の日報解析・未提出者検知・催促通知・サマリー生成・リーダー通知は実行されない", async () => {
    const input = {
      targetDate: "2024-01-15",
      leaderUserId: "leader-001",
    };

    await expect(runTx4Imp1Agent(input)).rejects.toThrow(
      NoActiveReportersFound
    );
    await expect(runTx4Imp1Agent(input)).rejects.toThrow(
      "提出状況を確認する対象の報告者が存在しません。"
    );

    let caughtError: any;
    try {
      await runTx4Imp1Agent(input);
    } catch (e) {
      caughtError = e;
    }

    // エラーの型（クラス名）を、識別コードに相当するものとして検証する。
    expect(caughtError).toBeInstanceOf(NoActiveReportersFound);
    expect(caughtError.constructor.name).toBe("NoActiveReportersFound");
    expect(caughtError.message).toBe(
      "提出状況を確認する対象の報告者が存在しません。"
    );
    expect(caughtError).not.toBeInstanceOf(NonSubmissionDetectionFailed);

    expect(retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });
});
