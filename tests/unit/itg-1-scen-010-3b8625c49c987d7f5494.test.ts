import { runTx1Imp1Agent, Tx1Imp1AgentInput, Tx1Imp1AgentOutput, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-010: 5名全員が日報を提出した場合、未提出者への催促メール送信がスキップされ、promptsSent が0である', () => {
  it('全員が提出期限までに日報を提出した場合、executionStatus は success で、promptsSent は 0 である', async () => {
    const systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };
    const targetDate = new Date('2024-01-15');
    const executionTimestamp = new Date('2024-01-15T17:30:00+09:00');

    const submittedReports = [
      { reporterId: '1', reporterName: '太郎' },
      { reporterId: '2', reporterName: '花子' },
      { reporterId: '3', reporterName: '次郎' },
      { reporterId: '4', reporterName: '美咲' },
      { reporterId: '5', reporterName: '健太' },
    ];

    const mockAiClient: Tx1Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn().mockResolvedValue({
        authenticated: true,
        authorized: true,
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue(submittedReports),
      submitDailyReport: jest.fn().mockResolvedValue({
        reportId: 'report-123',
        submittedAt: new Date(),
        status: 'submitted',
      }),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-123',
        sentAt: new Date(),
        status: 'sent',
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [],
        detectionLog: 'All reporters submitted',
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({
        promptNotificationId: 'prompt-notif-123',
        sentAt: new Date(),
        status: 'sent',
      }),
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(5);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(5);
    expect(result.errors || []).toEqual([]);
    expect(result.executionSummary).toMatch(/全員が提出|催促不要/);
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
