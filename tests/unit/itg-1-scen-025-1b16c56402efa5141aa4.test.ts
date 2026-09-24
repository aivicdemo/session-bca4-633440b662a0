jest.mock("../../src/logic/business-day-deadline-judgment", () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-non-submission-detection", () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock("../../src/logic/non-submission-prompt-decision", () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-reminder-notification", () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
  sendLeaderSubmissionNotification: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-management-view", () => ({
  retrieveLeaderDashboardData: jest.fn(),
}));

import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import { judgeSchedulerExecutionTiming } from "../../src/logic/business-day-deadline-judgment";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";
import { judgePromptNecessityAndMethod } from "../../src/logic/non-submission-prompt-decision";
import {
  sendLeaderNonSubmissionPromptNotification,
  sendLeaderSubmissionNotification,
} from "../../src/logic/daily-report-reminder-notification";
import { retrieveLeaderDashboardData } from "../../src/logic/daily-report-management-view";

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.Mock;

describe("SCEN-025: リーダーユーザーID配列が空の場合、提出状況報告メール送信レコードが空で実行完了する", () => {
  const targetDate = "2024-01-15";
  const executionTimestamp = 1705309200000;
  const leaderUserIds: string[] = [];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: "営業日の提出期限超過時刻に該当",
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporterIds: ["R040"],
      detectionLogId: "LOG-2024-01-15",
      detectionCount: 1,
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      promptRequired: true,
      promptMethod: "email",
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue([
      {
        reporterUserId: "R040",
        emailSendingHistoryId: "EMAIL-PROMPT-R040",
        sendingStatus: "success",
        sentTimestamp: executionTimestamp,
      },
    ]);

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      leaderUserId: "unused",
      emailSendingHistoryId: "EMAIL-LEADER-UNUSED",
      sendingStatus: "success",
      sentTimestamp: executionTimestamp,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReportCount: 4,
      nonSubmittedReporterCount: 1,
      nonSubmittedReporters: [{ reporterId: "R040", reporterName: "報告者40" }],
      promptNotificationStatus: { sent: 1, failed: 0 },
    });
  });

  it("leaderUserIdsが空配列の場合、executionStatusが'success'で完了し、leaderNotificationsSentが空配列になる", async () => {
    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx2Imp1Agent(input, {});

    expect(result.executionStatus).toBe("success");
    expect(result.targetDate).toBe("2024-01-15");

    expect(result.detectionResult).toBeTruthy();
    expect(typeof result.detectionResult).toBe("object");

    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
    expect(result.promptNotificationsSent.length).toBeGreaterThanOrEqual(1);

    expect(result.leaderNotificationsSent).toEqual([]);
    expect(mockedSendLeaderSubmissionNotification).not.toHaveBeenCalled();

    expect(result.dashboardData).toBeTruthy();
    expect(typeof result.dashboardData).toBe("object");

    expect(typeof result.executionTimestamp).toBe("number");
    expect(result.executionTimestamp).toBeGreaterThan(0);
  });
});
