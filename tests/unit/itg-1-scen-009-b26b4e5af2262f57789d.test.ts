import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-009: 5名中3名が日報を提出し、2名が未提出のまま催促期限を迎え、executionStatus が partial_success となる', () => {
  it('should return partial_success when 3 out of 5 reporters submit and 2 receive prompts', async () => {
    // テスト前提条件の設定
    const systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };
    const targetDate = new Date('2024-01-15');
    const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');

    // モック AI クライアント
    const mockAiClient: Tx1Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn(async (input: any) => {
        // reporter1・2・3 は成功、reporter4・5 は失敗
        if (['reporter1', 'reporter2', 'reporter3'].includes(input.reporterId)) {
          return { authenticated: true, authorized: true };
        }
        throw new Error('認証失敗');
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { id: 'reporter1', name: 'Reporter 1' },
        { id: 'reporter2', name: 'Reporter 2' },
        { id: 'reporter3', name: 'Reporter 3' },
        { id: 'reporter4', name: 'Reporter 4' },
        { id: 'reporter5', name: 'Reporter 5' },
      ]),
      submitDailyReport: jest.fn(async (reporterId: string) => {
        // reporter1・2・3 は成功、reporter4・5 は対象外
        if (['reporter1', 'reporter2', 'reporter3'].includes(reporterId)) {
          return { reportId: `report-${reporterId}`, submittedAt: new Date() };
        }
        return null;
      }),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-123',
        sentAt: new Date(),
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue([
        { reporterId: 'reporter4', reporterName: 'Reporter 4', lastSubmittedDate: null },
        { reporterId: 'reporter5', reporterName: 'Reporter 5', lastSubmittedDate: null },
      ]),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({
        promptId: 'prompt-123',
        sentAt: new Date(),
      }),
    };

    // テスト実行
    const result = await runTx1Imp1Agent(
      { executionTimestamp, targetDate, systemContext },
      mockAiClient
    );

    // 期待結果の検証
    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5); // 全5名が促進対象
    expect(result.reportsSubmitted).toBe(3); // reporter1・2・3 が提出
    expect(result.nonSubmittedReporters).toHaveLength(2); // reporter4・5 が未提出
    expect(result.promptsSent).toBe(2); // 未提出者2名への催促メール送信成功
    expect(result.leaderNotificationsSent).toBe(3); // 提出者3名分のリーダー通知
    expect(result.errors || []).toHaveLength(0); // エラーなし
    expect(result.executionSummary).toBeTruthy();
  });
});
