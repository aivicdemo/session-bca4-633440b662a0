import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-010: 5名全員が日報を提出した場合、未提出者への催促メール送信がスキップされ、promptsSent が0である', () => {
  it('should return success with promptsSent=0 when all 5 reporters submit', async () => {
    // テスト前提条件
    const systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };
    const targetDate = new Date('2024-01-15');
    const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');

    // モック AI クライアント
    const mockAiClient: Tx1Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn().mockResolvedValue({
        authenticated: true,
        authorized: true,
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { id: 'reporter1', name: 'Reporter 1' },
        { id: 'reporter2', name: 'Reporter 2' },
        { id: 'reporter3', name: 'Reporter 3' },
        { id: 'reporter4', name: 'Reporter 4' },
        { id: 'reporter5', name: 'Reporter 5' },
      ]),
      submitDailyReport: jest.fn().mockResolvedValue({
        reportId: 'report-123',
        submittedAt: new Date(),
      }),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-123',
        sentAt: new Date(),
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue([]),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
    };

    // テスト実行
    const result = await runTx1Imp1Agent(
      { executionTimestamp, targetDate, systemContext },
      mockAiClient
    );

    // 期待結果の検証
    expect(result.executionStatus).toBe('success');
    expect(result.reportersPrompted).toBe(5); // 全員が促進対象
    expect(result.reportsSubmitted).toBe(5); // 全員が提出
    expect(result.nonSubmittedReporters).toEqual([]); // 未提出者がいない
    expect(result.promptsSent).toBe(0); // 催促メールが送信されなかった
    expect(result.leaderNotificationsSent).toBe(5); // リーダー通知は5件
    expect(result.errors || []).toHaveLength(0); // エラーなし
    expect(result.executionSummary).toBeTruthy();
    // sendLeaderNonSubmissionPromptNotification は呼ばれないことを確認
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
