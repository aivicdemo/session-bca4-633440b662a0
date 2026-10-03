import { runTx1Imp1Agent, Tx1Imp1AgentInput, Tx1Imp1AgentOutput, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-011: 複数の報告者でエラーが発生し、executionStatus が partial_success で複数エラーが errors 配列に記録される', () => {
  it('複数のエラーが発生した場合、executionStatus は partial_success で、errors 配列に記録される', async () => {
    const systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };
    const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
    const targetDate = new Date('2024-01-15');

    const reporters = [
      { reporterId: '1', reporterName: '太郎' },
      { reporterId: '2', reporterName: '花子' },
      { reporterId: '3', reporterName: '次郎' },
      { reporterId: '4', reporterName: '美咲' },
      { reporterId: '5', reporterName: '健太' },
    ];

    const mockAiClient: Tx1Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue(reporters),
      authenticateAndAuthorizeReporterAccess: jest.fn(async (input: any) => {
        if (['1', '2'].includes(input.reporterId)) {
          return { authenticated: true, authorized: true };
        }
        throw new Error('従業員の認証に失敗しました');
      }),
      submitDailyReport: jest.fn(async (reporterId: string) => {
        if (['1', '2', '5'].includes(reporterId)) {
          return { reportId: `report-${reporterId}`, submittedAt: new Date() };
        }
        if (reporterId === '3') {
          throw new Error('日報の提出に失敗しました');
        }
        return null;
      }),
      sendLeaderSubmissionNotification: jest.fn(async (input: any) => {
        if (input.reporterId === '2') {
          throw new Error('リーダーへの通知送信に失敗しました');
        }
        return { notificationId: `notif-${input.reporterId}`, sentAt: new Date() };
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { userId: '3', userName: '次郎', emailAddress: 'jiro@example.com', promptSent: false, lastSubmittedDate: null },
          { userId: '4', userName: '美咲', emailAddress: 'misaki@example.com', promptSent: false, lastSubmittedDate: null },
        ],
        detectionLog: 'Detected 2 non-submitted reporters',
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn(async (input: any) => {
        if (input.reporterId === '4') {
          throw new Error('未提出者への催促送信に失敗しました');
        }
        return { promptId: `prompt-${input.reporterId}`, sentAt: new Date() };
      }),
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0].userId).toBe('3');
    expect(result.nonSubmittedReporters[0].userName).toBe('次郎');
    expect(result.nonSubmittedReporters[1].userId).toBe('4');
    expect(result.nonSubmittedReporters[1].userName).toBe('美咲');
    expect(result.promptsSent).toBe(1);
    expect(result.leaderNotificationsSent).toBe(2);
    expect(result.errors).toBeDefined();
    expect(result.errors).toHaveLength(4);
    expect(result.executionSummary).toMatch(/partial_success/);
  });
});
