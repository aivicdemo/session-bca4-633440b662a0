import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx2Imp1Agent, type Tx2Imp1AgentInput, type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-024: 複数のリーダーユーザーIDが指定された場合、全リーダーに提出状況報告メールが送信される', () => {
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

  it('複数のリーダー（3人）に提出状況報告メールが送信される', async () => {
    const leaderUserIds = ['leader-001', 'leader-002', 'leader-003'];
    const targetDate = '2024-01-15';
    const executionTimestamp = Date.now();

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
      promptMethod: 'email',
    });

    mockAiClient.sendLeaderNonSubmissionPromptNotification?.mockResolvedValue({
      sent: true,
      recipients: leaderUserIds,
    });

    const leaderNotificationRecords = leaderUserIds.map((id, idx) => ({
      leaderUserId: id,
      emailSendingHistoryId: `hist-${idx + 1}`,
      sendingStatus: 'success' as const,
      sentTimestamp: executionTimestamp,
    }));

    mockAiClient.sendLeaderSubmissionNotification?.mockResolvedValue(leaderNotificationRecords);

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

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe(targetDate);
    expect(result.executionTimestamp).toBe(executionTimestamp);

    if (result.leaderNotificationsSent && Array.isArray(result.leaderNotificationsSent)) {
      expect(result.leaderNotificationsSent.length).toBe(3);
      const sentLeaderIds = result.leaderNotificationsSent.map((r: any) => r.leaderUserId);
      expect(sentLeaderIds).toContain('leader-001');
      expect(sentLeaderIds).toContain('leader-002');
      expect(sentLeaderIds).toContain('leader-003');
    }
  });
});
