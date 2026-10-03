import { runTx1Imp1Agent, Tx1Imp1AgentInput, Tx1Imp1AgentOutput, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-014: nonSubmittedReporters に含まれる報告者の lastSubmittedDate が正確に記録される', () => {
  it('未提出者の lastSubmittedDate が正確に記録される（過去提出日時とnullの両方を含む）', async () => {
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
        { reporterId: 'R001', reporterName: '山田太郎' },
        { reporterId: 'R002', reporterName: '佐藤花子' },
        { reporterId: 'R003', reporterName: '鈴木次郎' },
        { reporterId: 'R004', reporterName: '報告者4' },
        { reporterId: 'R005', reporterName: '報告者5' },
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
          {
            userId: 'R001',
            userName: '山田太郎',
            emailAddress: 'r001@example.com',
            promptSent: false,
            lastSubmittedDate: new Date('2024-01-12T15:30:00+09:00'),
          },
          {
            userId: 'R002',
            userName: '佐藤花子',
            emailAddress: 'r002@example.com',
            promptSent: false,
            lastSubmittedDate: new Date('2024-01-10T14:15:00+09:00'),
          },
          {
            userId: 'R003',
            userName: '鈴木次郎',
            emailAddress: 'r003@example.com',
            promptSent: false,
            lastSubmittedDate: null,
          },
        ],
        detectionLog: 'Detected 3 non-submitted reporters',
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

    expect(['success', 'partial_success']).toContain(output.executionStatus);
    expect(output.nonSubmittedReporters).toHaveLength(3);

    const r001 = output.nonSubmittedReporters.find(r => r.userId === 'R001');
    expect(r001).toBeDefined();
    expect(r001?.userId).toBe('R001');
    expect(r001?.userName).toBe('山田太郎');
    expect(r001?.lastSubmittedDate).toEqual(new Date('2024-01-12T15:30:00+09:00'));

    const r002 = output.nonSubmittedReporters.find(r => r.userId === 'R002');
    expect(r002).toBeDefined();
    expect(r002?.userId).toBe('R002');
    expect(r002?.userName).toBe('佐藤花子');
    expect(r002?.lastSubmittedDate).toEqual(new Date('2024-01-10T14:15:00+09:00'));

    const r003 = output.nonSubmittedReporters.find(r => r.userId === 'R003');
    expect(r003).toBeDefined();
    expect(r003?.userId).toBe('R003');
    expect(r003?.userName).toBe('鈴木次郎');
    expect(r003?.lastSubmittedDate).toBeNull();
  });
});
