import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-011: 複数の報告者でエラーが発生し、executionStatus が partial_success で複数エラーが errors 配列に記録される', () => {
  it('should return partial_success with multiple errors recorded', async () => {
    // テスト前提
    const systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };
    const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
    const targetDate = new Date('2024-01-15');

    const reporters = [
      { id: '1', name: '太郎' },
      { id: '2', name: '花子' },
      { id: '3', name: '次郎' },
      { id: '4', name: '美咲' },
      { id: '5', name: '健太' },
    ];

    // モック AI クライアント
    const mockAiClient: Tx1Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue(reporters),
      authenticateAndAuthorizeReporterAccess: jest.fn(async (input: any) => {
        // 従業員 1, 2 は成功、従業員 3, 4 は失敗
        if (['1', '2'].includes(input.reporterId)) {
          return { authenticated: true, authorized: true };
        }
        throw new Error('認証失敗');
      }),
      submitDailyReport: jest.fn(async (reporterId: string) => {
        // 従業員 1, 2, 5 は成功、従業員 3 は失敗、従業員 4 は対象外
        if (['1', '2', '5'].includes(reporterId)) {
          return { reportId: `report-${reporterId}`, submittedAt: new Date() };
        }
        if (reporterId === '3') {
          throw new Error('提出失敗');
        }
        return null;
      }),
      sendLeaderSubmissionNotification: jest.fn(async (input: any) => {
        // 従業員 2 からの通知送信で失敗
        if (input.reporterId === '2') {
          throw new Error('通知送信失敗');
        }
        return { notificationId: `notif-${input.reporterId}`, sentAt: new Date() };
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue([
        { reporterId: '3', reporterName: '次郎', lastSubmittedDate: null },
        { reporterId: '4', reporterName: '美咲', lastSubmittedDate: null },
      ]),
      sendLeaderNonSubmissionPromptNotification: jest.fn(async (input: any) => {
        // 従業員 4 への催促で失敗、従業員 3 は成功
        if (input.reporterId === '4') {
          throw new Error('催促送信失敗');
        }
        return { promptId: `prompt-${input.reporterId}`, sentAt: new Date() };
      }),
    };

    // テスト実行
    const result = await runTx1Imp1Agent(
      { executionTimestamp, targetDate, systemContext },
      mockAiClient
    );

    // 期待結果の検証
    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3); // 従業員 1, 2, 5 が提出
    expect(result.nonSubmittedReporters).toHaveLength(2); // 従業員 3, 4 が未提出
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: '3',
      userName: '次郎',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: '4',
      userName: '美咲',
    });
    expect(result.promptsSent).toBe(1); // 従業員 3 への催促のみ成功
    expect(result.leaderNotificationsSent).toBe(2); // 従業員 1, 5 からの通知成功
    expect(result.errors).toBeDefined();
    expect(result.errors).toHaveLength(4); // 4件のエラー
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        errorMessage: expect.stringContaining('認証'),
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        errorMessage: expect.stringContaining('提出'),
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        errorMessage: expect.stringContaining('通知'),
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        errorMessage: expect.stringContaining('催促'),
      })
    );
    expect(result.executionSummary).toContain('partial_success');
  });
});
