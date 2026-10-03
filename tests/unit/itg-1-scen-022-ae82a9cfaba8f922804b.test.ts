import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-022: リーダーへの提出状況報告メール送信に失敗した場合、エラーが捕捉される', () => {
  it('リーダー報告メール送信失敗時にエラーログが記録される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      }),
      detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
        nonSubmittedReporterIds: [],
        detectionLogId: 'LOG-001',
        detectionCount: 0,
      }),
      judgePromptNecessityAndMethod: jest.fn() as any,
      sendLeaderNonSubmissionPromptNotification: jest.fn() as any,
      sendLeaderSubmissionNotification: (jest.fn() as any).mockRejectedValue(
        new Error('リーダーへの報告メール送信に失敗しました。')
      ),
      retrieveLeaderDashboardData: (jest.fn() as any).mockResolvedValue({
        submittedReportCount: 5,
        nonSubmittedReporterCount: 0,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 0, failed: 0 },
      }),
    };

    const input: Tx2Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705276800000,
      leaderUserIds: ['leader-001', 'leader-002'],
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);
    expect(result.detectionResult.detectionCount).toBe(0);

    expect(mockAiClient.judgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalled();
  });
});
