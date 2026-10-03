import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx2Imp1Agent, type Tx2Imp1AgentInput, type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-024: 複数のリーダーユーザーIDが指定された場合、全リーダーに提出状況報告メールが送信される', () => {
  it('複数のリーダー（3人）に提出状況報告メールが送信される', async () => {
    // テスト用の複数リーダーユーザーID配列を準備
    const leaderUserIds = ['leader-001', 'leader-002', 'leader-003'];
    const targetDate = '2024-01-15';
    const executionTimestamp = Date.now();

    // モックを設定
    const mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn(async () => ({
        isExecutionTime: true,
        deadlineReached: true,
      })),
      detectNonSubmittedReportersAtDeadline: jest.fn(async () => ({
        nonSubmittedReporterIds: ['emp-001', 'emp-002'],
        detectionLogId: 'log-001',
        detectionCount: 2,
      })),
      judgePromptNecessityAndMethod: jest.fn(async () => ({
        shouldSendPrompt: true,
        promptMethod: 'email',
      })),
      sendLeaderNonSubmissionPromptNotification: jest.fn(async () => ({
        sent: true,
      })),
      // 重要: 各リーダーごとに個別のレコードを返す実装
      sendLeaderSubmissionNotification: jest.fn(async (leaderUserId: string) => ({
        leaderUserId,
        emailSendingHistoryId: `hist-${leaderUserId}`,
        sendingStatus: 'success',
        sentTimestamp: executionTimestamp,
      })),
      retrieveLeaderDashboardData: jest.fn(async () => ({
        submittedReportCount: 10,
        nonSubmittedReporterCount: 2,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 2, failed: 0 },
      })),
    } as Tx2Imp1AiClient;

    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    // 検証: executionStatus が 'success'
    expect(result.executionStatus).toBe('success');

    // 検証: targetDate が入力値と一致
    expect(result.targetDate).toBe(targetDate);

    // 検証: executionTimestamp が応答時刻となっている
    expect(result.executionTimestamp).toBe(executionTimestamp);

    // 検証: leaderNotificationsSent 配列の長さが leaderUserIds の長さと同じ（3件）
    expect(result.leaderNotificationsSent).toHaveLength(3);

    // 検証: leaderNotificationsSent 内の各 LeaderNotificationRecord が sendLeaderSubmissionNotification の呼び出しで生成され、
    // leaderUserIds 内の全てのユーザーID（'leader-001', 'leader-002', 'leader-003'）に対して1件ずつメール送信記録が存在
    const notifiedLeaderIds = result.leaderNotificationsSent.map((r: any) => r.leaderUserId);
    expect(notifiedLeaderIds).toEqual(expect.arrayContaining(leaderUserIds));
    expect(notifiedLeaderIds).toHaveLength(leaderUserIds.length);

    // 各リーダーに対するレコードを検証
    for (let i = 0; i < leaderUserIds.length; i++) {
      expect(result.leaderNotificationsSent[i]).toMatchObject({
        leaderUserId: leaderUserIds[i],
        emailSendingHistoryId: `hist-${leaderUserIds[i]}`,
        sendingStatus: 'success',
        sentTimestamp: executionTimestamp,
      });
    }

    // 検証: sendLeaderSubmissionNotification が各リーダーに対して1回ずつ呼び出された
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledTimes(3);
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledWith('leader-001');
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledWith('leader-002');
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledWith('leader-003');
  });
});
