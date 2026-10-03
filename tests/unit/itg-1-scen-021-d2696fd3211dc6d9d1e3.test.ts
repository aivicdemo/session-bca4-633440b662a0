import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-021: 未提出者への催促メール送信に失敗した場合、エラーが捕捉される', () => {
  it('催促メール送信失敗時にエラーログが記録される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      }),
      detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
        nonSubmittedReporterIds: ['user-002', 'user-003', 'user-004'],
        detectionLogId: 'LOG-001',
        detectionCount: 3,
      }),
      judgePromptNecessityAndMethod: (jest.fn() as any).mockResolvedValue({
        isPromptNecessary: true,
        promptMethod: 'email',
      }),
      sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockRejectedValue(
        new Error('催促メール送信に失敗しました。')
      ),
      sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
        leaderUserId: 'leader-001',
        emailSendingHistoryId: 'EMAIL-001',
        sendingStatus: 'success',
        sentTimestamp: 1705310400000,
      }),
      retrieveLeaderDashboardData: (jest.fn() as any).mockResolvedValue({
        submittedReportCount: 2,
        nonSubmittedReporterCount: 3,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 0, failed: 0 },
      }),
    };

    const input: Tx2Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705310400000,
      leaderUserIds: ['leader-001'],
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);
    expect(result.detectionResult.detectionCount).toBe(3);

    expect(mockAiClient.judgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
  });
});
