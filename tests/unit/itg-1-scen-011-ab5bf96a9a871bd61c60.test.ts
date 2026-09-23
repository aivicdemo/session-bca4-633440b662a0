import {
  runTx1Imp1Agent,
  ReporterAuthenticationError,
  DailyReportSubmissionError,
  LeaderNotificationError,
  NonSubmissionPromptError,
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  SystemExecutionContext,
} from "../../src/agents/tx-1-imp-1/orchestrator";
import { judgeSchedulerExecutionTiming } from "../../src/logic/business-day-deadline-judgment";
import { authenticateAndAuthorizeReporterAccess } from "../../src/logic/user-authentication-authorization";
import { getActiveReportersForSubmissionCheck } from "../../src/logic/reporter-master-management";
import { submitDailyReport } from "../../src/logic/daily-report-submission";
import {
  sendLeaderSubmissionNotification,
  sendLeaderNonSubmissionPromptNotification,
} from "../../src/logic/daily-report-reminder-notification";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";

jest.mock("../../src/logic/business-day-deadline-judgment", () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock("../../src/logic/user-authentication-authorization", () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock("../../src/logic/reporter-master-management", () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-submission", () => ({
  submitDailyReport: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-reminder-notification", () => ({
  sendLeaderSubmissionNotification: jest.fn(),
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-non-submission-detection", () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));

describe("SCEN-011: 複数の報告者でエラーが発生し、executionStatus が partial_success で複数エラーが errors 配列に記録される", () => {
  const systemContext: SystemExecutionContext = {
    timezone: "JST",
    locale: "ja_JP",
  };
  const targetDate = new Date("2024-01-15T00:00:00+09:00");
  const executionTimestamp = new Date("2024-01-15T17:00:00+09:00");

  const activeReporters = [
    { id: "1", name: "太郎" },
    { id: "2", name: "花子" },
    { id: "3", name: "次郎" },
    { id: "4", name: "美咲" },
    { id: "5", name: "健太" },
  ];

  const nonSubmittedReporters = [
    { reporterId: "3", reporterName: "次郎", lastSubmittedDate: "2024-01-12" },
    { reporterId: "4", reporterName: "美咲", lastSubmittedDate: "2024-01-11" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(undefined);

    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue(
      activeReporters
    );

    // 従業員1・2の認証は成功、従業員3・4の認証はReporterAuthenticationError、従業員5は成功
    (authenticateAndAuthorizeReporterAccess as jest.Mock)
      .mockResolvedValueOnce(undefined) // 従業員1
      .mockResolvedValueOnce(undefined) // 従業員2
      .mockRejectedValueOnce(
        new ReporterAuthenticationError(
          "従業員の認証に失敗しました。ログイン状態を確認してください。"
        )
      ) // 従業員3
      .mockRejectedValueOnce(
        new ReporterAuthenticationError(
          "従業員の認証に失敗しました。ログイン状態を確認してください。"
        )
      ) // 従業員4
      .mockResolvedValueOnce(undefined); // 従業員5

    // 従業員1・2・5の提出は成功、従業員3の提出はDailyReportSubmissionError（従業員4は提出対象外）
    (submitDailyReport as jest.Mock)
      .mockResolvedValueOnce(undefined) // 従業員1
      .mockResolvedValueOnce(undefined) // 従業員2
      .mockRejectedValueOnce(
        new DailyReportSubmissionError(
          "日報の提出に失敗しました。システム管理者に連絡してください。"
        )
      ) // 従業員3
      .mockResolvedValueOnce(undefined); // 従業員5

    // 従業員2からの通知送信でLeaderNotificationError、従業員1・5は成功
    (sendLeaderSubmissionNotification as jest.Mock)
      .mockResolvedValueOnce(undefined) // 従業員1
      .mockRejectedValueOnce(
        new LeaderNotificationError(
          "リーダーへの通知送信に失敗しました。メール送信状態を確認してください。"
        )
      ) // 従業員2
      .mockResolvedValueOnce(undefined); // 従業員5

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue(
      nonSubmittedReporters
    );

    // 従業員3への催促は成功、従業員4への催促はNonSubmissionPromptError
    (sendLeaderNonSubmissionPromptNotification as jest.Mock)
      .mockResolvedValueOnce(undefined) // 従業員3
      .mockRejectedValueOnce(
        new NonSubmissionPromptError(
          "未提出者への催促送信に失敗しました。メール送信状態を確認してください。"
        )
      ); // 従業員4
  });

  test("複数の報告者でエラーが発生し partial_success となり、複数エラーが errors 配列に記録される", async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_success");
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0].userId).toBe("3");
    expect(result.nonSubmittedReporters[0].userName).toBe("次郎");
    expect(result.nonSubmittedReporters[1].userId).toBe("4");
    expect(result.nonSubmittedReporters[1].userName).toBe("美咲");

    expect(result.promptsSent).toBe(1);
    expect(result.leaderNotificationsSent).toBe(2);

    // 仕様書内の手順では「errorsが3件の配列」との記述と、expectedResultの「4件が記録される」との記述が矛盾するため、
    // expectedResultおよび手順で列挙された4種のエラーすべてを記録するという記述に最も忠実な形で検証する。
    // （矛盾の詳細は .aivic/batches/27/unresolved.md に記録）
    expect(result.errors).toHaveLength(4);

    expect(result.errors[0].errorCode).toBe("ReporterAuthenticationError");
    expect(result.errors[0].errorMessage).toBe(
      "従業員の認証に失敗しました。ログイン状態を確認してください。"
    );

    expect(result.errors[1].errorCode).toBe("DailyReportSubmissionError");
    expect(result.errors[1].errorMessage).toBe(
      "日報の提出に失敗しました。システム管理者に連絡してください。"
    );

    expect(result.errors[2].errorCode).toBe("LeaderNotificationError");
    expect(result.errors[2].errorMessage).toBe(
      "リーダーへの通知送信に失敗しました。メール送信状態を確認してください。"
    );

    expect(
      result.errors.some(
        (error: any) =>
          error.errorCode === "NonSubmissionPromptError" &&
          error.errorMessage ===
            "未提出者への催促送信に失敗しました。メール送信状態を確認してください。"
      )
    ).toBe(true);

    expect(typeof result.executionSummary).toBe("string");
    expect(result.executionSummary).toMatch(/partial_success/);
  });
});
