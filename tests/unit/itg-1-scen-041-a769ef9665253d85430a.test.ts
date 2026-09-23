import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import { judgeBusinessDayAndDeadline } from "../../src/logic/business-day-deadline-judgment";
import { getActiveReportersForSubmissionCheck } from "../../src/logic/reporter-master-management";
import { retrieveDailyReportsForLeaderReview } from "../../src/logic/daily-report-persistence";

jest.mock("../../src/logic/business-day-deadline-judgment");
jest.mock("../../src/logic/reporter-master-management");
jest.mock("../../src/logic/daily-report-persistence");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/non-submission-prompt-decision");
jest.mock("../../src/logic/daily-report-reminder-notification");
jest.mock("../../src/logic/email-notification-management");
jest.mock("../../src/logic/daily-report-management-view");

const ACTIVE_REPORTERS = [
  {
    reporterId: "R001",
    userId: "U001",
    reporterName: "報告者1",
    emailAddress: "u001@example.com",
    department: "開発部",
    status: "active",
  },
];

describe("SCEN-041: 日報の自動解析に失敗した場合、DailyReportAnalysisFailedエラーが発生しexecutionStatusはfailureになる", () => {
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
      reporters: ACTIVE_REPORTERS,
      totalCount: ACTIVE_REPORTERS.length,
      message: "対象報告者を取得しました。",
    });

    // 日報自動解析処理（受信済み日報の取得）が失敗する状況を再現する。
    (retrieveDailyReportsForLeaderReview as jest.Mock).mockRejectedValue(
      new Error("データベース接続に失敗しました。")
    );
  });

  it("executionStatusが'failure'になり、DailyReportAnalysisFailedがerrorsに含まれ、他のフィールドは出力されない", async () => {
    const input = {
      targetDate: "2024-01-15",
      leaderUserId: "leader-001",
      teamId: "team-001",
    };

    const result = await runTx4Imp1Agent(input);

    expect(result.executionStatus).toBe("failure");

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DailyReportAnalysisFailed",
          message: "日報の自動解析処理に失敗しました。",
        }),
      ])
    );

    expect(result.submittedReportCount).toBeUndefined();
    expect(result.nonSubmittedReporterCount).toBeUndefined();
    expect(result.nonSubmittedReporters).toBeUndefined();
    expect(result.promptNotificationsSent).toBeUndefined();
    expect(result.progressSummary).toBeUndefined();
    expect(result.leaderNotificationSent).toBeUndefined();

    expect(result.detectionLogId == null).toBe(true);
    expect(result.executionTimestamp == null).toBe(true);
  });
});
