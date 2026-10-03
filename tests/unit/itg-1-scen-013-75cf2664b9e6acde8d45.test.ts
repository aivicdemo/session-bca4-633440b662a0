import { runTx1Imp1Agent, Tx1Imp1AgentInput, Tx1Imp1AgentOutput, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-013: leaderNotificationsSent がリーダーに送信された通知数（提出済み日報ごと）と一致する', () => {
  it('提出済み日報3件に対してリーダー通知が3件送信される', async () => {
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
        { reporterId: 'R001', reporterName: '報告者1' },
        { reporterId: 'R002', reporterName: '報告者2' },
        { reporterId: 'R003', reporterName: '報告者3' },
        { reporterId: 'R004', reporterName: '報告者4' },
        { reporterId: 'R005', reporterName: '報告者5' },
      ]),
      submitDailyReport: jest.fn()
        .mockResolvedValueOnce({ submissionId: 'sub-R001', submittedAt: new Date() })
        .mockResolvedValueOnce({ submissionId: 'sub-R002', submittedAt: new Date() })
        .mockResolvedValueOnce({ submissionId: 'sub-R003', submittedAt: new Date() })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-123',
        sentAt: new Date(),
        status: 'sent',
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { userId: 'R004', userName: '報告者4', emailAddress: 'r004@example.com', promptSent: false, lastSubmittedDate: null },
          { userId: 'R005', userName: '報告者5', emailAddress: 'r005@example.com', promptSent: false, lastSubmittedDate: null },
        ],
        detectionLog: 'Detected 2 non-submitted reporters',
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({
        promptId: 'prompt-123',
        sentAt: new Date(),
        status: 'sent',
      }),
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    expect(output.leaderNotificationsSent).toBe(3);
    expect(['success', 'partial_success']).toContain(output.executionStatus);
    expect(output.reportersPrompted).toBe(5);
    expect(output.reportsSubmitted).toBe(3);
    expect(output.nonSubmittedReporters).toHaveLength(2);
    expect(output.promptsSent).toBe(2);
    expect(output.errors ?? []).toEqual([]);
    expect(output.executionSummary).toBeTruthy();
  });
});
