import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-008: 未提出者への催促メール送信に失敗し、催促が送信されず、催促エラーが記録される', () => {
  it('should return partial_success with NonSubmissionPromptError when prompt notification fails', async () => {
    // テスト前提条件の設定
    const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
    const targetDate = new Date('2024-01-15');
    const systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };

    // モック AI クライアント
    const mockAiClient: Tx1Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn().mockResolvedValue({
        authenticated: true,
        authorized: true,
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { id: 'reporter1', name: '従業員1' },
        { id: 'reporter2', name: '従業員2' },
        { id: 'reporter3', name: '従業員3' },
        { id: 'reporter4', name: '従業員4' },
        { id: 'reporter5', name: '従業員5' },
      ]),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue([
        { reporterId: 'reporter4', reporterName: '従業員4', lastSubmittedDate: null },
        { reporterId: 'reporter5', reporterName: '従業員5', lastSubmittedDate: null },
      ]),
      submitDailyReport: jest.fn().mockResolvedValue({
        reportId: 'report-123',
        submittedAt: new Date(),
      }),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-123',
        sentAt: new Date(),
      }),
      sendLeaderNonSubmissionPromptNotification: jest
        .fn()
        .mockRejectedValue(new Error('メール送信に失敗しました')),
    };

    // テスト実行
    const result = await runTx1Imp1Agent(
      { executionTimestamp, targetDate, systemContext },
      mockAiClient
    );

    // 期待結果の検証
    expect(result.executionStatus).toBe('partial_success');
    expect(result.promptsSent).toBe(0);
    expect(result.errors).toBeDefined();
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        errorMessage: expect.stringContaining('催促送信に失敗'),
      })
    );
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.leaderNotificationsSent).toBe(3);
    expect(result.executionSummary).toContain('失敗');
  });
});
