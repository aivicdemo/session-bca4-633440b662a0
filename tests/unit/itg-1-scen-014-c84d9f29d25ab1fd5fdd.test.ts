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
  { reporterId: "R001", userId: "R001", reporterName: "山田太郎", emailAddress: "r001@example.com", department: "営業部", status: "active" },
  { reporterId: "R002", userId: "R002", reporterName: "佐藤花子", emailAddress: "r002@example.com", department: "営業部", status: "active" },
  { reporterId: "R003", userId: "R003", reporterName: "鈴木次郎", emailAddress: "r003@example.com", department: "営業部", status: "active" },
  { reporterId: "R004", userId: "R004", reporterName: "報告者4", emailAddress: "r004@example.com", department: "営業部", status: "active" },
  { reporterId: "R005", userId: "R005", reporterName: "報告者5", emailAddress: "r005@example.com", department: "営業部", status: "active" },
];

const submittedReporterIds = ["R004", "R005"];

const nonSubmittedReporters = [
  { reporterId: "R001", reporterName: "山田太郎", lastSubmittedDate: new Date("2024-01-12T15:30:00+09:00") },
  { reporterId: "R002", reporterName: "佐藤花子", lastSubmittedDate: new Date("2024-01-10T14:15:00+09:00") },
  { reporterId: "R003", reporterName: "鈴木次郎", lastSubmittedDate: null },
];

describe("SCEN-014: nonSubmittedReporters に含まれる報告者の lastSubmittedDate が正確に記録される", () => {
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
      nonSubmittedReporters,
      detectionLog: {
        detectionLogId: "LOG001",
        targetDate: "2024-01-15",
        detectionDateTime: "2024-01-15T17:00:00+09:00",
        totalReportersCount: activeReporters.length,
        nonSubmittedCount: nonSubmittedReporters.length,
        submittedCount: submittedReporterIds.length,
      },
      detectionTimestamp: "2024-01-15T17:00:00+09:00",
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "NOTIF-PROMPT",
      sentAt: new Date("2024-01-15T17:01:00+09:00"),
      deliveryMethod: "email",
      nonSubmittedReporterCount: nonSubmittedReporters.length,
      errorDetails: null,
    });
  });

  it("未提出者ごとの lastSubmittedDate（過去提出あり／提出履歴なし）が出力にそのまま反映される", async () => {
    const input = {
      executionTimestamp: new Date("2024-01-15T17:00:00+09:00"),
      targetDate: new Date("2024-01-15T00:00:00+09:00"),
      systemContext: {
        timezone: "Asia/Tokyo",
        locale: "ja_JP",
      },
    };

    const result = await runTx1Imp1Agent(input);

    expect(["success", "partial_success"]).toContain(result.executionStatus);
    expect(result.nonSubmittedReporters).toHaveLength(3);

    const r001 = result.nonSubmittedReporters.find((r: any) => r.reporterId === "R001");
    const r002 = result.nonSubmittedReporters.find((r: any) => r.reporterId === "R002");
    const r003 = result.nonSubmittedReporters.find((r: any) => r.reporterId === "R003");

    expect(r001).toBeDefined();
    expect(r002).toBeDefined();
    expect(r003).toBeDefined();

    expect(new Date(r001.lastSubmittedDate).toISOString()).toBe(
      new Date("2024-01-12T15:30:00+09:00").toISOString()
    );
    expect(new Date(r002.lastSubmittedDate).toISOString()).toBe(
      new Date("2024-01-10T14:15:00+09:00").toISOString()
    );
    expect(r003.lastSubmittedDate).toBeNull();

    for (const reporter of result.nonSubmittedReporters) {
      expect(reporter).toHaveProperty("reporterId");
      expect(reporter).toHaveProperty("reporterName");
      expect(reporter).toHaveProperty("lastSubmittedDate");
    }
  });
});
