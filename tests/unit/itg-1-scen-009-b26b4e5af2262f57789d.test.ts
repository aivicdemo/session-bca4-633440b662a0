import {
  runTx1Imp1Agent,
  ReporterAuthenticationError,
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

describe("SCEN-009: 5名中3名が日報を提出し、2名が未提出のまま催促期限を迎え、executionStatus が partial_success となる", () => {
  const systemContext: SystemExecutionContext = {
    timezone: "Asia/Tokyo",
    locale: "ja-JP",
  };
  const targetDate = new Date("2024-01-15T00:00:00+09:00");
  const executionTimestamp = new Date("2024-01-15T17:00:00+09:00");

  const activeReporters = [
    { id: "reporter1", name: "報告者1" },
    { id: "reporter2", name: "報告者2" },
    { id: "reporter3", name: "報告者3" },
    { id: "reporter4", name: "報告者4" },
    { id: "reporter5", name: "報告者5" },
  ];

  const nonSubmittedReporters = [
    {
      reporterId: "reporter4",
      reporterName: "報告者4",
      lastSubmittedDate: "2024-01-12",
    },
    {
      reporterId: "reporter5",
      reporterName: "報告者5",
      lastSubmittedDate: "2024-01-11",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValue(undefined);

    (authenticateAndAuthorizeReporterAccess as jest.Mock)
      .mockResolvedValueOnce(undefined) // reporter1: 認証成功
      .mockResolvedValueOnce(undefined) // reporter2: 認証成功
      .mockResolvedValueOnce(undefined) // reporter3: 認証成功
      .mockRejectedValueOnce(
        new ReporterAuthenticationError(
          "従業員の認証に失敗しました。ログイン状態を確認してください。"
        )
      ) // reporter4: 認証失敗
      .mockRejectedValueOnce(
        new ReporterAuthenticationError(
          "従業員の認証に失敗しました。ログイン状態を確認してください。"
        )
      ); // reporter5: 認証失敗

    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue(
      activeReporters
    );

    (submitDailyReport as jest.Mock)
      .mockResolvedValueOnce(undefined) // reporter1: 提出成功
      .mockResolvedValueOnce(undefined) // reporter2: 提出成功
      .mockResolvedValueOnce(undefined); // reporter3: 提出成功
    // reporter4・reporter5は認証失敗のため提出対象外

    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue(
      undefined
    ); // reporter1・2・3の送信ごとに成功（計3回）

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue(
      nonSubmittedReporters
    );

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      undefined
    ); // reporter4・5への催促ごとに成功（計2回）
  });

  test("promptsSent=2、reportsSubmitted=3、leaderNotificationsSent=3 で partial_success となる", async () => {
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
    expect(result.promptsSent).toBe(2);
    expect(result.leaderNotificationsSent).toBe(3);

    expect(
      result.errors === undefined || result.errors.length === 0
    ).toBe(true);

    expect(typeof result.executionSummary).toBe("string");
    expect(result.executionSummary).toMatch(/3/);
    expect(result.executionSummary).toMatch(/2/);
  });
});
