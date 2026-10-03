import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-019: 未提出者検知ログ記録に失敗した場合、エラーが捕捉される', () => {
  it('未提出者検知処理でエラーが発生した場合、エラーログが記録される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      }),
      detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockRejectedValue(
        new Error('未提出者検知ログの記録に失敗しました。')
      ),
      judgePromptNecessityAndMethod: jest.fn() as any,
      sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
        reporterUserId: 'user-001',
        emailSendingHistoryId: 'EMAIL-HIST-001',
        sendingStatus: 'success',
        sentTimestamp: 1705315200000,
      }),
      sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
        leaderUserId: 'leader-001',
        emailSendingHistoryId: 'EMAIL-001',
        sendingStatus: 'success',
        sentTimestamp: 1705315200000,
      }),
      retrieveLeaderDashboardData: (jest.fn() as any).mockResolvedValue({
        submittedReportCount: 3,
        nonSubmittedReporterCount: 2,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 0, failed: 0 },
      }),
    };

    const input: Tx2Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705315200000,
      leaderUserIds: ['leader-001'],
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);
    expect(result.detectionResult).toBeDefined();
    expect(result.detectionResult.detectionCount).toBe(0);

    expect(mockAiClient.judgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
  });
});
