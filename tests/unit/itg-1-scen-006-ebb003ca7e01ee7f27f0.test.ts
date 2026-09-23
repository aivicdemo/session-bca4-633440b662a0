import {
  runTx1Imp1Agent,
  LeaderNotificationError,
} from "../../src/agents/tx-1-imp-1/orchestrator";
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
  { reporterId: "R001", userId: "U001", reporterName: "報告者1", emailAddress: "r001@example.com", department: "営業部", status: "active" },
  { reporterId: "R002", userId: "U002", reporterName: "報告者2", emailAddress: "r002@example.com", department: "営業部", status: "active" },
  { reporterId: "R003", userId: "U003", reporterName: "報告者3", emailAddress: "r003@example.com", department: "営業部", status: "active" },
  { reporterId: "R004", userId: "U004", reporterName: "報告者4", emailAddress: "r004@example.com", department: "営業部", status: "active" },
  { reporterId: "R005", userId: "U005", reporterName: "報告者5", emailAddress: "r005@example.com", department: "営業部", status: "active" },
];

describe("SCEN-006: 提出済みの日報に対するリーダーへの通知送信に失敗し、通知エラーが記録される", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: "営業日の実行時刻内",
    });

    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
      message: "取得成功",
    });

    (authenticateAndAuthorizeReporterAccess as jest.Mock).mockResolvedValue({
      isAccessGranted: true,
      userId: "U000",
      denialReason: null,
    });

    (submitDailyReport as jest.Mock).mockResolvedValue({
      dailyReportId: "DR000",
      userId: "U000",
      reportDate: "2024-01-15",
      submissionTimestamp: "2024-01-15T17:00:00+09:00",
      submissionStatus: "submitted",
      notificationTriggered: true,
      completionMessage: "提出が完了しました。",
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporters: [
        { userId: "U005", userName: "報告者5", emailAddress: "r005@example.com", promptPriority: "high" },
      ],
      detectionLog: {
        detectionLogId: "LOG001",
        targetDate: "2024-01-15",
        detectionDateTime: "2024-01-15T17:00:00+09:00",
        totalReportersCount: 5,
        nonSubmittedCount: 1,
        submittedCount: 4,
      },
      detectionTimestamp: "2024-01-15T17:00:00+09:00",
    });

    (sendLeaderSubmissionNotification as jest.Mock).mockRejectedValue(
      new LeaderNotificationError(
        "リーダーへの通知送信に失敗しました。メール送信状態を確認してください。"
      )
    );

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "NOTIF001",
      sentAt: new Date("2024-01-15T17:01:00+09:00"),
      deliveryMethod: "email",
      nonSubmittedReporterCount: 1,
      errorDetails: null,
    });
  });

  it("リーダー通知の失敗がpartial_successとして記録され、未提出者への催促は成功する", async () => {
    const input = {
      executionTimestamp: new Date("2024-01-15T17:00:00+09:00"),
      targetDate: new Date("2024-01-15T00:00:00+09:00"),
      systemContext: {
        timezone: "Asia/Tokyo",
        locale: "ja-JP",
      },
    };

    const result = await runTx1Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_success");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: "LeaderNotificationError",
          errorMessage:
            "リーダーへの通知送信に失敗しました。メール送信状態を確認してください。",
        }),
      ])
    );
    expect(result.leaderNotificationsSent).toBe(0);
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(4);
    expect(result.promptsSent).toBeGreaterThanOrEqual(1);
    expect(typeof result.executionSummary).toBe("string");
    expect(result.executionSummary.length).toBeGreaterThan(0);
    expect(result.executionSummary).toMatch(/通知/);
    expect(result.executionSummary).toMatch(/失敗/);
  });
});
