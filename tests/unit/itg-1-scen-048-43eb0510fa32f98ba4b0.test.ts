import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-048: 処理中に複数のエラーが発生した場合、executionStatusはpartial_failureになりerrorsフィールドにすべてのエラーが記録される', () => {
  it('複数のエラーが発生した場合、executionStatusがpartial_failureになり、すべてのエラーがerrorsに記録される', async () => {
    // テスト用の日付（営業日）、リーダーユーザーID、チームIDを設定する
    const targetDate = '2025-09-24';
    const leaderUserId = 'leader-001';
    const teamId = 'team-001';

    // 複数のエラーを返すモッククライアントをセットアップ
    const mockAiClient: Tx4Imp1AiClient = {
      judgeBusinessDayAndDeadline: jest.fn().mockResolvedValue({
        isBusinessDay: true,
        isWithinDeadline: true,
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue({
        reporters: [
          { userId: 'reporter-1', userName: 'reporter1', reporterName: 'Reporter 1' },
          { userId: 'reporter-2', userName: 'reporter2', reporterName: 'Reporter 2' },
        ],
      }),
      retrieveDailyReportsForLeaderReview: jest
        .fn()
        .mockRejectedValue(new Error('日報の自動解析処理に失敗しました。')),
      detectNonSubmittedReportersAtDeadline: jest
        .fn()
        .mockRejectedValue(new Error('未提出者の検知に失敗しました。')),
      sendLeaderNonSubmissionPromptNotification: jest
        .fn()
        .mockRejectedValue(new Error('未提出者への催促メール送信に失敗しました。')),
      retrieveLeaderDashboardData: jest
        .fn()
        .mockRejectedValue(new Error('チーム進捗サマリーの生成に失敗しました。')),
      sendNonSubmissionPromptNotification: jest
        .fn()
        .mockRejectedValue(new Error('リーダーへの通知送信に失敗しました。')),
    };

    // runTx4Imp1Agent を入力値（targetDate、leaderUserId、teamId）で呼び出す
    const result = await runTx4Imp1Agent(
      {
        targetDate,
        leaderUserId,
        teamId,
      },
      mockAiClient
    );

    // 戻り値の executionStatus フィールドを検証する
    expect(result.executionStatus).toBe('partial_failure');

    // 戻り値の errors フィールドの内容を検証する
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(5);

    // 各エラーコードとメッセージを検証
    const expectedErrors = [
      {
        code: 'DailyReportAnalysisFailed',
        message: '日報の自動解析処理に失敗しました。',
      },
      {
        code: 'NonSubmissionDetectionFailed',
        message: '未提出者の検知に失敗しました。',
      },
      {
        code: 'PromptNotificationSendingFailed',
        message: '未提出者への催促メール送信に失敗しました。',
      },
      {
        code: 'ProgressSummaryGenerationFailed',
        message: 'チーム進捗サマリーの生成に失敗しました。',
      },
      {
        code: 'LeaderNotificationFailed',
        message: 'リーダーへの通知送信に失敗しました。',
      },
    ];

    expectedErrors.forEach((expectedError) => {
      const actualError = result.errors.find((e: any) => e.code === expectedError.code);
      expect(actualError).toBeDefined();
      expect(actualError.message).toBe(expectedError.message);
    });

    // 戻り値の targetDate、executionTimestamp、leaderNotificationSent などのフィールドが出力型の仕様に合致していることを確認する
    expect(result.targetDate).toBe(targetDate);
    expect(typeof result.executionTimestamp).toBe('string');
    expect(result.leaderNotificationSent).toBe(false);
    expect(typeof result.submittedReportCount).toBe('number');
    expect(typeof result.nonSubmittedReporterCount).toBe('number');
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(typeof result.promptNotificationsSent).toBe('number');
    expect(typeof result.promptNotificationsFailed).toBe('number');
    expect(typeof result.progressSummary).toBe('string');
    expect(typeof result.detectionLogId).toBe('string');
  });
});
