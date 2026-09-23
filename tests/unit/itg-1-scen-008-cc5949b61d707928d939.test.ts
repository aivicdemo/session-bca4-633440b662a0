import {
  runTx1Imp1Agent,
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

describe("SCEN-008: 未提出者への催促メール送信に失敗し、催促が送信されず、催促エラーが記録される", () => {
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
    (authenticateAndAuthorizeReporterAccess as jest.Mock).mockResolvedValue(
      undefined
    );
    (getActiveReportersForSubmissionCheck as jest.Mock).mockResolvedValue(
      activeReporters
    );
    (submitDailyReport as jest.Mock).mockResolvedValue(undefined);
    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue(
      undefined
    );
    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue(
      nonSubmittedReporters
    );
    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockRejectedValue(
      new NonSubmissionPromptError(
        "未提出者への催促送信に失敗しました。メール送信状態を確認してください。"
      )
    );
  });

  test("催促メール送信に失敗し、promptsSent が 0 で partial_success となる", async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_success");
    expect(result.promptsSent).toBe(0);
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.leaderNotificationsSent).toBe(3);

    expect(
      result.errors.some(
        (error: any) =>
          error.errorCode === "NonSubmissionPromptError" &&
          error.errorMessage ===
            "未提出者への催促送信に失敗しました。メール送信状態を確認してください。"
      )
    ).toBe(true);

    expect(typeof result.executionSummary).toBe("string");
    expect(result.executionSummary.length).toBeGreaterThan(0);
    expect(result.executionSummary).toMatch(/催促/);
    expect(result.executionSummary).toMatch(/失敗/);
  });
});
