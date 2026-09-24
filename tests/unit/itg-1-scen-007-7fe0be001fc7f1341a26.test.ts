import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";

class NonSubmissionDetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonSubmissionDetectionError';
  }
}
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
];

describe("SCEN-007: 未提出者の検知処理に失敗し、未提出者への催促が実行されず、検知エラーが記録される", () => {
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

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "NOTIF000",
      sentAt: new Date("2024-01-15T17:00:30+09:00"),
      deliveryMethod: "email",
      errorDetails: null,
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockRejectedValue(
      new NonSubmissionDetectionError(
        "未提出者の検知に失敗しました。システム管理者に連絡してください。"
      )
    );

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: "NOTIF001",
      sentAt: new Date("2024-01-15T17:01:00+09:00"),
      deliveryMethod: "email",
      nonSubmittedReporterCount: 0,
      errorDetails: null,
    });
  });

  it("未提出者検知の失敗によりエージェント全体がfailureとなり、催促が実行されない", async () => {
    const input = {
      executionTimestamp: new Date("2024-01-15T17:00:00+09:00"),
      targetDate: new Date("2024-01-15T00:00:00+09:00"),
      systemContext: {
        timezone: "Asia/Tokyo",
        locale: "ja-JP",
      },
    };
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe("failure");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: "NonSubmissionDetectionError",
          errorMessage:
            "未提出者の検知に失敗しました。システム管理者に連絡してください。",
        }),
      ])
    );
    expect(result.promptsSent).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(result.executionSummary).toContain("未提出者の検知に失敗しました");
  });
});
