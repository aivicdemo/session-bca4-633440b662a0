import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-024: 複数のリーダーユーザーIDが指定された場合、全リーダーに提出状況報告メールが送信される', () => {
  let mockAiClient: Tx2Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockReturnValue({
        isExecutionTime: true,
        deadlineReached: true,
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockReturnValue({
        hasNonSubmittedReporters: true,
        nonSubmittedReporters: [
          { userId: 'emp-001', name: 'Employee 1' },
          { userId: 'emp-002', name: 'Employee 2' },
        ],
      }),
      judgePromptNecessityAndMethod: jest.fn().mockReturnValue({
        shouldSendPrompt: true,
        promptMethod: 'email',
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockReturnValue({
        sent: true,
        recipients: ['leader-001', 'leader-002', 'leader-003'],
      }),
      sendLeaderSubmissionNotification: jest.fn().mockImplementation((leaderUserId: string) => {
        return {
          sent: true,
          leaderUserId,
          timestamp: Date.now(),
          message: `提出状況報告メール送信完了: ${leaderUserId}`,
        };
      }),
      retrieveLeaderDashboardData: jest.fn().mockReturnValue({
        totalEmployees: 10,
        submittedCount: 8,
        nonSubmittedCount: 2,
        submissionRate: 80,
      }),
    };
  });

  it('3人のリーダーに対して提出状況報告メールが1件ずつ送信される', async () => {
    const leaderUserIds = ['leader-001', 'leader-002', 'leader-003'];
    const targetDate = '2024-01-15';
    const executionTimestamp = Date.now();

    const input = {
      leaderUserIds,
      targetDate,
      executionTimestamp,
    };

    const response = await runTx2Imp1Agent(input, mockAiClient);

    expect(response).toBeDefined();
    expect(response.executionStatus).toBe('success');
    expect(response.targetDate).toBe(targetDate);
    expect(response.executionTimestamp).toBeLessThanOrEqual(Date.now());

    expect(response.leaderNotificationsSent).toBeDefined();
    expect(response.leaderNotificationsSent).toHaveLength(3);

    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledTimes(3);
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledWith('leader-001');
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledWith('leader-002');
    expect(mockAiClient.sendLeaderSubmissionNotification).toHaveBeenCalledWith('leader-003');

    const sentLeaderIds = response.leaderNotificationsSent.map(
      (record: any) => record.leaderUserId
    );
    expect(sentLeaderIds).toContain('leader-001');
    expect(sentLeaderIds).toContain('leader-002');
    expect(sentLeaderIds).toContain('leader-003');

    expect(mockAiClient.judgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockAiClient.judgePromptNecessityAndMethod).toHaveBeenCalled();
    expect(mockAiClient.retrieveLeaderDashboardData).toHaveBeenCalled();
  });

  it('全ての依存関数がスタブ化された正しい呼び出し順序で実行される', async () => {
    const leaderUserIds = ['leader-001', 'leader-002'];
    const targetDate = '2024-01-20';
    const executionTimestamp = Date.now();

    const input = {
      leaderUserIds,
      targetDate,
      executionTimestamp,
    };

    const response = await runTx2Imp1Agent(input, mockAiClient);

    expect(response.executionStatus).toBe('success');
    expect(response.leaderNotificationsSent).toHaveLength(2);
  });
});
