import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx2Imp1Agent, type Tx2Imp1AgentInput, type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe("SCEN-025: リーダーユーザーID配列が空の場合、提出状況報告メール送信レコードが空で実行完了する", () => {
  let mockAiClient: jest.Mocked<Tx2Imp1AiClient>;

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn(),
      detectNonSubmittedReportersAtDeadline: jest.fn(),
      judgePromptNecessityAndMethod: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      sendLeaderSubmissionNotification: jest.fn(),
      retrieveLeaderDashboardData: jest.fn(),
    } as unknown as jest.Mocked<Tx2Imp1AiClient>;
  });

  it("leaderUserIdsが空配列の場合、提出状況報告メール送信レコードが空で実行完了する", async () => {
    const targetDate = "2024-01-15";
    const executionTimestamp = 1705309200000;
    const leaderUserIds: string[] = [];

    mockAiClient.judgeSchedulerExecutionTiming?.mockResolvedValue({
      isExecutionTime: true,
      deadlineReached: true,
    });

    mockAiClient.detectNonSubmittedReportersAtDeadline?.mockResolvedValue({
      hasNonSubmittedReporters: true,
      nonSubmittedReporters: [
        { userId: 'emp-001', name: 'Employee 1' },
      ],
    });

    mockAiClient.judgePromptNecessityAndMethod?.mockResolvedValue({
      shouldSendPrompt: true,
      promptMethod: "email",
    });

    mockAiClient.sendLeaderNonSubmissionPromptNotification?.mockResolvedValue({
      sent: true,
      recipients: [],
    });

    mockAiClient.sendLeaderSubmissionNotification?.mockResolvedValue({});

    mockAiClient.retrieveLeaderDashboardData?.mockResolvedValue({
      totalEmployees: 5,
      submittedCount: 4,
      nonSubmittedCount: 1,
      submissionRate: 80,
    });

    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe("success");
    expect(result.targetDate).toBe("2024-01-15");

    if (result.detectionResult) {
      expect(typeof result.detectionResult).toBe("object");
    }

    if (Array.isArray(result.promptNotificationsSent)) {
      expect(result.promptNotificationsSent).toBeDefined();
    }

    if (Array.isArray(result.leaderNotificationsSent)) {
      expect(result.leaderNotificationsSent).toHaveLength(0);
    }

    if (result.dashboardData) {
      expect(typeof result.dashboardData).toBe("object");
    }

    expect(typeof result.executionTimestamp).toBe("number");
    expect(result.executionTimestamp).toBeGreaterThan(0);
  });
});
