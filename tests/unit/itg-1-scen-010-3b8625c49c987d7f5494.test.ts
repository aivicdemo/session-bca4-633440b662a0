import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-010: 全員が提出', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn().mockResolvedValue({ isAuthenticated: true }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { id: 'reporter1', name: 'Reporter 1' },
        { id: 'reporter2', name: 'Reporter 2' },
        { id: 'reporter3', name: 'Reporter 3' },
        { id: 'reporter4', name: 'Reporter 4' },
        { id: 'reporter5', name: 'Reporter 5' },
      ]),
      submitDailyReport: jest.fn().mockResolvedValue({ success: true, submittedAt: new Date() }),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({ success: true }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [],
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
    };
  });

  it('5名全員が提出した場合、未提出者への催促メール送信がスキップされ、promptsSent が0である', async () => {
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

    expect(result.executionStatus).toBe('success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(5);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(5);
    expect(result.errors).toEqual([]);
    expect(result.executionSummary).toContain('全員が提出');
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
