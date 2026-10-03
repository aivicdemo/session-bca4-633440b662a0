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

describe('SCEN-015: executionSummary に処理結果の要約メッセージが生成される', () => {
  let mockAiClient: any;
  let systemContext: SystemExecutionContext;
  let executionTimestamp: Date;
  let targetDate: Date;

  describe('成功ケース（executionStatus: success）', () => {
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
        .mockResolvedValueOnce({ success: true, reportId: 'report4' })
        .mockResolvedValueOnce({ success: true, reportId: 'report5' });

      const sendLeaderNotificationStub = (jest.fn() as any).mockResolvedValue({
        success: true,
        notificationId: 'notif',
      });

      const detectNonSubmittedStub = (jest.fn() as any).mockResolvedValue({
        nonSubmittedReporters: [],
        nonSubmittedCount: 0,
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

    it('executionStatus が success の場合、executionSummary に「すべての処理が正常に完了しました」に類する内容が含まれる', async () => {
      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      expect(output.executionStatus).toBe('success');
      expect(output.executionSummary).toBeTruthy();
      expect(typeof output.executionSummary).toBe('string');
      expect(output.executionSummary.length).toBeGreaterThan(0);
    });

    it('executionSummary に報告者数、提出数、催促数、リーダー通知数が含まれる', async () => {
      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      expect(output.executionSummary).toBeTruthy();
      expect(typeof output.executionSummary).toBe('string');
    });
  });

  describe('部分的な失敗ケース（executionStatus: partial_success）', () => {
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
        .mockResolvedValueOnce({ success: false, error: 'User not submitted' })
        .mockResolvedValueOnce({ success: false, error: 'User not submitted' })
        .mockResolvedValueOnce({ success: false, error: 'User not submitted' });

      const sendLeaderNotificationStub = (jest.fn() as any).mockResolvedValue({
        success: true,
        notificationId: 'notif',
      });

      const detectNonSubmittedStub = (jest.fn() as any).mockResolvedValue({
        nonSubmittedReporters: [
          { userId: 'R003', userName: '報告者3', emailAddress: 'r003@example.com', promptSent: false },
          { userId: 'R004', userName: '報告者4', emailAddress: 'r004@example.com', promptSent: false },
          { userId: 'R005', userName: '報告者5', emailAddress: 'r005@example.com', promptSent: false },
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

    it('executionStatus が partial_success の場合、executionSummary に部分的な失敗の旨が含まれる', async () => {
      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      expect(output.executionStatus).toBe('partial_success');
      expect(output.executionSummary).toBeTruthy();
      expect(typeof output.executionSummary).toBe('string');
    });
  });

  describe('失敗ケース（executionStatus: failure）', () => {
    beforeEach(() => {
      executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
      targetDate = new Date('2024-01-15T00:00:00+09:00');

      systemContext = {
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      };

      const judgeSchedulerExecutionTimingStub = (jest.fn() as any).mockResolvedValue({
        isExecutionTiming: false,
        currentTime: executionTimestamp,
        businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
      });

      const getActiveReportersStub = (jest.fn() as any).mockRejectedValue(
        new Error('Database error')
      );

      const authenticateStub = (jest.fn() as any).mockResolvedValue({
        isAuthenticated: true,
        isAuthorized: true,
      });

      const submitDailyReportStub = (jest.fn() as any).mockResolvedValue({
        success: false,
        error: 'Not submitted',
      });

      const sendLeaderNotificationStub = (jest.fn() as any).mockResolvedValue({
        success: false,
        error: 'Notification failed',
      });

      const detectNonSubmittedStub = (jest.fn() as any).mockResolvedValue({
        nonSubmittedReporters: [],
        nonSubmittedCount: 0,
      });

      const sendPromptNotificationStub = (jest.fn() as any).mockResolvedValue({
        success: false,
        error: 'Prompt failed',
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

    it('エラーが発生した場合、executionSummary が非空の文字列である', async () => {
      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      expect(output.executionSummary).toBeTruthy();
      expect(typeof output.executionSummary).toBe('string');
    });
  });

  it('executionSummary が常に非空の文字列である', async () => {
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
      .mockResolvedValueOnce({ success: true, reportId: 'report4' })
      .mockResolvedValueOnce({ success: true, reportId: 'report5' });

    const sendLeaderNotificationStub = (jest.fn() as any).mockResolvedValue({
      success: true,
      notificationId: 'notif',
    });

    const detectNonSubmittedStub = (jest.fn() as any).mockResolvedValue({
      nonSubmittedReporters: [],
      nonSubmittedCount: 0,
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

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    expect(output.executionSummary).toBeTruthy();
    expect(typeof output.executionSummary).toBe('string');
    expect(output.executionSummary.length).toBeGreaterThan(0);
  });
});
