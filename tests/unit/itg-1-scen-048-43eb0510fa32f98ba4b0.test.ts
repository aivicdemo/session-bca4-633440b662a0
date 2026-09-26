import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-048: 処理中に複数のエラーが発生した場合、executionStatusはpartial_failureになりerrorsフィールドにすべてのエラーが記録される', () => {
  it('should return partial_failure with all errors when multiple operations fail', async () => {
    const targetDate = '2024-01-15';
    const leaderUserId = 'leader-001';
    const teamId = 'team-A';

    const mockAiClient: Tx4Imp1AiClient = {
      judgeBusinessDayAndDeadline: jest.fn().mockResolvedValue({
        isBusinessDay: true,
        deadline: '2024-01-15T17:00:00+09:00',
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { userId: 'user-001', userName: 'reporter-001', reporterName: 'Reporter 1' },
        { userId: 'user-002', userName: 'reporter-002', reporterName: 'Reporter 2' },
      ]),
      retrieveDailyReportsForLeaderReview: jest
        .fn()
        .mockRejectedValue(new Error('DailyReportAnalysisFailed')),
      detectNonSubmittedReportersAtDeadline: jest
        .fn()
        .mockRejectedValue(new Error('NonSubmissionDetectionFailed')),
      judgePromptNecessityAndMethod: jest
        .fn()
        .mockResolvedValue({ isPromptRequired: true }),
      sendLeaderNonSubmissionPromptNotification: jest
        .fn()
        .mockRejectedValue(new Error('PromptNotificationSendingFailed')),
      sendNonSubmissionPromptNotification: jest
        .fn()
        .mockRejectedValue(new Error('LeaderNotificationFailed')),
      retrieveLeaderDashboardData: jest
        .fn()
        .mockRejectedValue(new Error('ProgressSummaryGenerationFailed')),
    };

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(5);

    const errorCodes = result.errors.map((e: any) => e.code);
    expect(errorCodes).toContain('DailyReportAnalysisFailed');
    expect(errorCodes).toContain('NonSubmissionDetectionFailed');
    expect(errorCodes).toContain('PromptNotificationSendingFailed');
    expect(errorCodes).toContain('ProgressSummaryGenerationFailed');
    expect(errorCodes).toContain('LeaderNotificationFailed');

    const dailyReportError = result.errors.find((e: any) => e.code === 'DailyReportAnalysisFailed');
    expect(dailyReportError?.message).toBe('日報の自動解析処理に失敗しました。');

    const nonSubmissionError = result.errors.find((e: any) => e.code === 'NonSubmissionDetectionFailed');
    expect(nonSubmissionError?.message).toBe('未提出者の検知に失敗しました。');

    const promptError = result.errors.find((e: any) => e.code === 'PromptNotificationSendingFailed');
    expect(promptError?.message).toBe('未提出者への催促メール送信に失敗しました。');

    const progressError = result.errors.find((e: any) => e.code === 'ProgressSummaryGenerationFailed');
    expect(progressError?.message).toBe('チーム進捗サマリーの生成に失敗しました。');

    const leaderError = result.errors.find((e: any) => e.code === 'LeaderNotificationFailed');
    expect(leaderError?.message).toBe('リーダーへの通知送信に失敗しました。');

    expect(result.targetDate).toBe(targetDate);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
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
