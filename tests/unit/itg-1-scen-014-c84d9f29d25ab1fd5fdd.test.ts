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
  lastSubmittedDate?: Date | null;
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

describe('SCEN-014: nonSubmittedReporters に含まれる報告者の lastSubmittedDate が正確に記録される', () => {
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
        { userId: 'R001', userName: '山田太郎', emailAddress: 'r001@example.com' },
        { userId: 'R002', userName: '佐藤花子', emailAddress: 'r002@example.com' },
        { userId: 'R003', userName: '鈴木次郎', emailAddress: 'r003@example.com' },
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
        { userId: 'R001', userName: '山田太郎', emailAddress: 'r001@example.com', promptSent: false, lastSubmittedDate: new Date('2024-01-12T15:30:00+09:00') },
        { userId: 'R002', userName: '佐藤花子', emailAddress: 'r002@example.com', promptSent: false, lastSubmittedDate: new Date('2024-01-10T14:15:00+09:00') },
        { userId: 'R003', userName: '鈴木次郎', emailAddress: 'r003@example.com', promptSent: false, lastSubmittedDate: null },
      ],
      nonSubmittedCount: 3,
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

  it('nonSubmittedReporters に含まれる報告者の lastSubmittedDate が正確に記録される', async () => {
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
    expect(r001?.lastSubmittedDate).toEqual(new Date('2024-01-12T15:30:00+09:00'));

    const r002 = output.nonSubmittedReporters.find(r => r.userId === 'R002');
    expect(r002).toBeDefined();
    expect(r002?.lastSubmittedDate).toEqual(new Date('2024-01-10T14:15:00+09:00'));

    const r003 = output.nonSubmittedReporters.find(r => r.userId === 'R003');
    expect(r003).toBeDefined();
    expect(r003?.lastSubmittedDate).toBeNull();
  });
});
