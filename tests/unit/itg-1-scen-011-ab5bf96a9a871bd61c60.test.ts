import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-011: 複数エラー発生', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn().mockImplementation((reporterId: string) => {
        if (['employee1', 'employee2'].includes(reporterId)) {
          return Promise.resolve({ isAuthenticated: true });
        } else if (['employee3', 'employee4'].includes(reporterId)) {
          const err = new Error('従業員の認証に失敗しました。ログイン状態を確認してください。');
          (err as any).name = 'ReporterAuthenticationError';
          return Promise.reject(err);
        }
        return Promise.resolve({ isAuthenticated: true });
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { id: 'employee1', name: '太郎' },
        { id: 'employee2', name: '花子' },
        { id: 'employee3', name: '次郎' },
        { id: 'employee4', name: '美咲' },
        { id: 'employee5', name: '健太' },
      ]),
      submitDailyReport: jest.fn().mockImplementation((reporterId: string) => {
        if (reporterId === 'employee3') {
          const err = new Error('日報の提出に失敗しました。システム管理者に連絡してください。');
          (err as any).name = 'DailyReportSubmissionError';
          return Promise.reject(err);
        } else if (['employee1', 'employee2', 'employee5'].includes(reporterId)) {
          return Promise.resolve({ success: true, submittedAt: new Date() });
        }
        return Promise.resolve({ success: false });
      }),
      sendLeaderSubmissionNotification: jest.fn().mockImplementation((reporterId: string) => {
        if (reporterId === 'employee2') {
          const err = new Error('リーダーへの通知送信に失敗しました。メール送信状態を確認してください。');
          (err as any).name = 'LeaderNotificationError';
          return Promise.reject(err);
        }
        return Promise.resolve({ success: true });
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { reporterId: 'employee3', reporterName: '次郎', lastSubmittedDate: null },
          { reporterId: 'employee4', reporterName: '美咲', lastSubmittedDate: null },
        ],
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockImplementation((reporterId: string) => {
        if (reporterId === 'employee4') {
          const err = new Error('未提出者への催促送信に失敗しました。メール送信状態を確認してください。');
          (err as any).name = 'NonSubmissionPromptError';
          return Promise.reject(err);
        }
        return Promise.resolve({ success: true });
      }),
    };
  });

  it('複数の報告者でエラーが発生し、executionStatus が partial_success で複数エラーが errors 配列に記録される', async () => {
    const systemContext = {
      userId: 'system-user',
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };

    const executionTimestamp = new Date('2024-01-15T17:00:00Z');
    const targetDate = '2024-01-15';

    const result = await runTx1Imp1Agent(
      {
        executionTimestamp,
        targetDate,
        systemContext,
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.promptsSent).toBe(1);
    expect(result.leaderNotificationsSent).toBe(2);
    
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        name: 'ReporterAuthenticationError',
        reporterId: 'employee3',
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        name: 'DailyReportSubmissionError',
        reporterId: 'employee3',
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        name: 'LeaderNotificationError',
        reporterId: 'employee2',
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        name: 'NonSubmissionPromptError',
        reporterId: 'employee4',
      })
    );
    
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      reporterId: 'employee3',
      reporterName: '次郎',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      reporterId: 'employee4',
      reporterName: '美咲',
    });
    
    expect(result.executionSummary).toContain('partial_success');
  });
});
