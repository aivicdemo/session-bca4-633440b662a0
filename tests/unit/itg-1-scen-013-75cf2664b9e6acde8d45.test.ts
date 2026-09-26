import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

interface SystemExecutionContext {
  timezone: string;
  locale: string;
}

interface Tx1Imp1AgentInput {
  executionTimestamp: Date;
  targetDate: Date;
  systemContext: SystemExecutionContext;
}

interface NonSubmittedReporterInfo {
  userId: string;
  userName: string;
  emailAddress: string;
  promptSent: boolean;
}

interface AgentExecutionError {
  errorCode: string;
  errorMessage: string;
  affectedReporterCount?: number;
}

interface Tx1Imp1AgentOutput {
  executionStatus: 'success' | 'partial_success' | 'failure';
  reportersPrompted: number;
  reportsSubmitted: number;
  nonSubmittedReporters: NonSubmittedReporterInfo[];
  promptsSent: number;
  leaderNotificationsSent: number;
  errors?: AgentExecutionError[];
  executionSummary: string;
}

import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-013: leaderNotificationsSent がリーダーに送信された通知数（提出済み日報ごと）と一致する', () => {
  let mockAiClient: any;
  let systemContext: SystemExecutionContext;
  let executionTimestamp: Date;
  let targetDate: Date;

  beforeEach(() => {
    executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
    targetDate = new Date('2024-01-15T00:00:00+09:00');

    systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja-JP',
    };

    const judgeSchedulerExecutionTimingStub = (jest.fn() as any).mockResolvedValue({
      isExecutionTiming: true,
      currentTime: executionTimestamp,
      businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
    });

    const getActiveReportersStub = (jest.fn() as any).mockResolvedValue({
      reporters: [
        { userId: 'R001', userName: '報告者1', emailAddress: 'r001@example.com' },
        { userId: 'R002', userName: '報告者2', emailAddress: 'r002@example.com' },
        { userId: 'R003', userName: '報告者3', emailAddress: 'r003@example.com' },
        { userId: 'R004', userName: '報告者4', emailAddress: 'r004@example.com' },
        { userId: 'R005', userName: '報告者5', emailAddress: 'r005@example.com' },
      ],
      totalCount: 5,
    });

    const authenticateStub = (jest.fn() as any).mockResolvedValue({
      isAuthenticated: true,
      isAuthorized: true,
    });

    const submitDailyReportStub = (jest.fn() as any)
      .mockResolvedValueOnce({ success: true, reportId: 'report1' })
      .mockResolvedValueOnce({ success: true, reportId: 'report2' })
      .mockResolvedValueOnce({ success: true, reportId: 'report3' })
      .mockResolvedValueOnce({ success: false, error: 'User not submitted' })
      .mockResolvedValueOnce({ success: false, error: 'User not submitted' });

    const sendLeaderNotificationStub = (jest.fn() as any).mockResolvedValue({
      success: true,
      notificationId: 'notif',
    });

    const detectNonSubmittedStub = (jest.fn() as any).mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'R004', userName: '報告者4', emailAddress: 'r004@example.com' },
        { userId: 'R005', userName: '報告者5', emailAddress: 'r005@example.com' },
      ],
      nonSubmittedCount: 2,
    });

    const sendPromptNotificationStub = (jest.fn() as any).mockResolvedValue({
      success: true,
      promptId: 'prompt',
    });

    mockAiClient = {
      judgeSchedulerExecutionTiming: judgeSchedulerExecutionTimingStub,
      getActiveReportersForSubmissionCheck: getActiveReportersStub,
      authenticateAndAuthorizeReporterAccess: authenticateStub,
      submitDailyReport: submitDailyReportStub,
      sendLeaderSubmissionNotification: sendLeaderNotificationStub,
      detectNonSubmittedReportersAtDeadline: detectNonSubmittedStub,
      sendLeaderNonSubmissionPromptNotification: sendPromptNotificationStub,
    };
  });

  it('leaderNotificationsSent が提出済み日報3件に対応する3と一致する', async () => {
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
    expect(output.nonSubmittedReporters.length).toBe(2);
    expect(output.promptsSent).toBe(2);
    expect(output.errors ?? []).toEqual([]);
    expect(output.executionSummary).toBeTruthy();
  });
});
