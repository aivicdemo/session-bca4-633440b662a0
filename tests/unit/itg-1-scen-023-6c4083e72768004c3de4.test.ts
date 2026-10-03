import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-023: 管理画面表示用ダッシュボードデータ取得に失敗した場合、エラーが捕捉される', () => {
  it('ダッシュボードデータ取得失敗時にエラーログが記録される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      }),
      detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
        nonSubmittedReporterIds: ['user-003', 'user-004'],
        detectionLogId: 'LOG-001',
        detectionCount: 2,
      }),
      judgePromptNecessityAndMethod: (jest.fn() as any).mockResolvedValue({
        isPromptNecessary: true,
        promptMethod: 'email',
      }),
      sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
        sent: true,
        notificationId: 'NOTIF-002',
      }),
      sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
        leaderUserId: 'leader-001',
        emailSendingHistoryId: 'EMAIL-LEADER-001',
        sendingStatus: 'success',
        sentTimestamp: 1705305600000,
      }),
      retrieveLeaderDashboardData: (jest.fn() as any).mockRejectedValue(
        new Error('管理画面データの取得に失敗しました。')
      ),
    };

    const input: Tx2Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705305600000,
      leaderUserIds: ['leader-001'],
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);
    expect(result.detectionResult.detectionCount).toBe(2);
    expect(result.dashboardData).toBeNull();

    expect(mockAiClient.judgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalled();
    expect(mockAiClient.retrieveLeaderDashboardData).toHaveBeenCalled();
  });
});
