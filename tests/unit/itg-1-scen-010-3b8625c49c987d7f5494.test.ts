import {
  runTx1Imp1Agent,
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

describe("SCEN-010: 5名全員が日報を提出した場合、未提出者への催促メール送信がスキップされ、promptsSent が0である", () => {
  const systemContext: SystemExecutionContext = {
    timezone: "Asia/Tokyo",
    locale: "ja-JP",
  };
  const targetDate = new Date("2024-01-15T00:00:00+09:00");
  const executionTimestamp = new Date("2024-01-15T17:30:00+09:00");

  const activeReporters = [
    { id: "reporter1", name: "報告者1" },
    { id: "reporter2", name: "報告者2" },
    { id: "reporter3", name: "報告者3" },
    { id: "reporter4", name: "報告者4" },
    { id: "reporter5", name: "報告者5" },
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
    (submitDailyReport as jest.Mock).mockResolvedValue(undefined); // 5名全員が提出成功
    (sendLeaderSubmissionNotification as jest.Mock).mockResolvedValue(
      undefined
    ); // 5名分のリーダー通知が成功
    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue([]); // 未提出者なし
    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  test("全員提出済みのため催促メール送信がスキップされ success となる", async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input);

    expect(result.executionStatus).toBe("success");
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(5);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(5);

    expect(
      result.errors === undefined || result.errors.length === 0
    ).toBe(true);

    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();

    expect(typeof result.executionSummary).toBe("string");
    expect(result.executionSummary.length).toBeGreaterThan(0);
  });
});
