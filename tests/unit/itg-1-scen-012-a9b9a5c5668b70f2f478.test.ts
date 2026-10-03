import { runTx1Imp1Agent, Tx1Imp1AgentInput, Tx1Imp1AgentOutput, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-012: reportersPrompted が対象報告者数と一致し、reportsSubmitted が実際の提出数と一致する', () => {
  it('対象報告者数（5名）と実際の提出数（3名）が正確に追跡される', async () => {
    const systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja_JP',
    };
    const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
    const targetDate = new Date('2024-01-15');

    const mockAiClient: Tx1Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      authenticateAndAuthorizeReporterAccess: jest.fn().mockResolvedValue({
        authenticated: true,
        authorized: true,
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { reporterId: '1', reporterName: '太郎' },
        { reporterId: '2', reporterName: '花子' },
        { reporterId: '3', reporterName: '次郎' },
        { reporterId: '4', reporterName: '美咲' },
        { reporterId: '5', reporterName: '健太' },
      ]),
      submitDailyReport: jest.fn()
        .mockResolvedValueOnce({ reportId: 'report-1', submittedAt: new Date() })
        .mockResolvedValueOnce({ reportId: 'report-2', submittedAt: new Date() })
        .mockResolvedValueOnce({ reportId: 'report-3', submittedAt: new Date() })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-123',
        sentAt: new Date(),
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { userId: '4', userName: '美咲', emailAddress: 'misaki@example.com', promptSent: false, lastSubmittedDate: null },
          { userId: '5', userName: '健太', emailAddress: 'kenta@example.com', promptSent: false, lastSubmittedDate: null },
        ],
        detectionLog: 'Detected 2 non-submitted reporters',
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({
        promptId: 'prompt-123',
        sentAt: new Date(),
      }),
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    expect(output.reportersPrompted).toBe(5);
    expect(output.reportsSubmitted).toBe(3);
    expect(['partial_success', 'success']).toContain(output.executionStatus);
    expect(output.nonSubmittedReporters).toHaveLength(2);
    expect(output.promptsSent).toBe(2);
    expect(output.leaderNotificationsSent).toBe(3);
    expect(output.errors || []).toEqual([]);
  });
});
