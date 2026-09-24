import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-009: 5名中3名が提出、2名が未提出', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn().mockImplementation((reporterId: string) => {
        if (['reporter1', 'reporter2', 'reporter3'].includes(reporterId)) {
          return Promise.resolve({ isAuthenticated: true });
        } else {
          return Promise.reject(new Error('認証失敗'));
        }
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { id: 'reporter1', name: 'Reporter 1' },
        { id: 'reporter2', name: 'Reporter 2' },
        { id: 'reporter3', name: 'Reporter 3' },
        { id: 'reporter4', name: 'Reporter 4' },
        { id: 'reporter5', name: 'Reporter 5' },
      ]),
      submitDailyReport: jest.fn().mockImplementation((reporterId: string) => {
        if (['reporter1', 'reporter2', 'reporter3'].includes(reporterId)) {
          return Promise.resolve({ success: true, submittedAt: new Date() });
        } else {
          return Promise.resolve({ success: false });
        }
      }),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({ success: true }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { reporterId: 'reporter4', reporterName: 'Reporter 4', lastSubmittedDate: null },
          { reporterId: 'reporter5', reporterName: 'Reporter 5', lastSubmittedDate: null },
        ],
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({ success: true }),
    };
  });

  it('5名中3名が提出し、2名が未提出のまま催促期限を迎え、executionStatus が partial_success となる', async () => {
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
    expect(result.promptsSent).toBe(2);
    expect(result.leaderNotificationsSent).toBe(3);
    expect(result.errors).toEqual([]);
    expect(result.executionSummary).toContain('5名中3名が日報を提出');
  });
});
