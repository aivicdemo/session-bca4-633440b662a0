import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import { judgeSchedulerExecutionTiming } from "../../src/logic/business-day-deadline-judgment";
import { authenticateAndAuthorizeReporterAccess } from "../../src/logic/user-authentication-authorization";
import { getActiveReportersForSubmissionCheck } from "../../src/logic/reporter-master-management";
import { submitDailyReport } from "../../src/logic/daily-report-submission";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";
import {
  sendLeaderSubmissionNotification,
  sendLeaderNonSubmissionPromptNotification,
} from "../../src/logic/daily-report-reminder-notification";

jest.mock("../../src/logic/business-day-deadline-judgment");
jest.mock("../../src/logic/user-authentication-authorization");
jest.mock("../../src/logic/reporter-master-management");
jest.mock("../../src/logic/daily-report-submission");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/daily-report-reminder-notification");

const activeReporters = [
  { reporterId: "R001", userId: "R001", reporterName: "報告者1", emailAddress: "r001@example.com", department: "営業部", status: "active" },
  { reporterId: "R002", userId: "R002", reporterName: "報告者2", emailAddress: "r002@example.com", department: "営業部", status: "active" },
  { reporterId: "R003", userId: "R003", reporterName: "報告者3", emailAddress: "r003@example.com", department: "営業部", status: "active" },
  { reporterId: "R004", userId: "R004", reporterName: "報告者4", emailAddress: "r004@example.com", department: "営業部", status: "active" },
  { reporterId: "R005", userId: "R005", reporterName: "報告者5", emailAddress: "r005@example.com", department: "営業部", status: "active" },
];

const submittedReporterIds = ["R001", "R002", "R003"];
const nonSubmittedReporterIds = ["R004", "R005"];

describe("SCEN-015: executionSummary に処理結果の要約メッセージが生成される", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: "営業日の実行時刻内",
    });

    (authenticateAndAuthorizeReporterAccess as jest.Mock).mockImplementation((input: any) =>
      Promise.resolve({
        isAccessGranted: true,
        userId: input.userId,
        denialReason: null,
      })
    );

    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
      message: "取得成功",
    });

    (submitDailyReport as jest.Mock).mockImplementation((input: any) => {
      if (submittedReporterIds.includes(input.userId)) {
        return Promise.resolve({
          dailyReportId: `DR-${input.userId}`,
          userId: input.userId,
          reportDate: input.reportDate,
          submissionTimestamp: input.submissionTimestamp,
          submissionStatus: "submitted",
          notificationTriggered: true,
          completionMessage: "提出が完了しました。",
        });
      }
      return Promise.reject(new Error("入力内容がないため日報を生成できませんでした。"));
    });

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "NOTIF-SUB",
      sentAt: new Date("2024-01-15T17:00:30+09:00"),
      deliveryMethod: "email",
      errorDetails: null,
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporters: nonSubmittedReporterIds.map((userId) => ({
        userId,
        userName: `報告者${userId.slice(-1)}`,
        emailAddress: `${userId.toLowerCase()}@example.com`,
        promptPriority: "high",
      })),
      detectionLog: {
        detectionLogId: "LOG001",
        targetDate: "2024-01-15",
        detectionDateTime: "2024-01-15T17:00:00+09:00",
        totalReportersCount: activeReporters.length,
        nonSubmittedCount: nonSubmittedReporterIds.length,
        submittedCount: submittedReporterIds.length,
      },
      detectionTimestamp: "2024-01-15T17:00:00+09:00",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "NOTIF-PROMPT",
      sentAt: new Date("2024-01-15T17:01:00+09:00"),
      deliveryMethod: "email",
      nonSubmittedReporterCount: nonSubmittedReporterIds.length,
      errorDetails: null,
    });
  });

  it("すべての処理が成功した場合、日本語かつ各処理結果の数値を含む要約文が生成され、正常完了の旨が明示される", async () => {
    const input = {
      executionTimestamp: new Date("2024-01-15T17:00:00+09:00"),
      targetDate: new Date("2024-01-15T00:00:00+09:00"),
      systemContext: {
        timezone: "Asia/Tokyo",
        locale: "ja-JP",
      },
    };

    const result = await runTx1Imp1Agent(input);

    expect(["success", "partial_success", "failure"]).toContain(result.executionStatus);

    expect(typeof result.executionSummary).toBe("string");
    expect(result.executionSummary.length).toBeGreaterThan(0);

    // reportersPrompted=5, reportsSubmitted=3, promptsSent=2, leaderNotificationsSent=3 の値が要約に反映されていること
    expect(result.executionSummary).toContain(String(result.reportersPrompted));
    expect(result.executionSummary).toContain(String(result.reportsSubmitted));
    expect(result.executionSummary).toContain(String(result.promptsSent));
    expect(result.executionSummary).toContain(String(result.leaderNotificationsSent));

    // 日本語で業務上の意味が明確であること
    expect(result.executionSummary).toMatch(/[ぁ-んァ-ヶ一-龠]/);

    if (!result.errors || result.errors.length === 0) {
      expect(result.executionSummary).toMatch(/(すべての処理が正常に完了しました|正常に完了)/);
    } else {
      expect(result.executionSummary).toMatch(/エラー/);
      for (const err of result.errors) {
        expect(result.executionSummary).toEqual(
          expect.stringContaining(err.errorMessage ?? err.errorCode)
        );
      }
    }
  });

  it("エラーが発生した場合、executionSummary にエラー発生の旨と概要が含まれる", async () => {
    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockRejectedValue(
      new Error("メール送信に失敗しました。")
    );

    const input = {
      executionTimestamp: new Date("2024-01-15T17:00:00+09:00"),
      targetDate: new Date("2024-01-15T00:00:00+09:00"),
      systemContext: {
        timezone: "Asia/Tokyo",
        locale: "ja-JP",
      },
    };

    const result = await runTx1Imp1Agent(input);

    expect(typeof result.executionSummary).toBe("string");
    expect(result.executionSummary.length).toBeGreaterThan(0);
    expect(result.errors && result.errors.length).toBeGreaterThan(0);
    expect(result.executionSummary).toMatch(/エラー/);
  });
});
