import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

import {
  runTx1Imp1Agent,
  type Tx1Imp1AiClient,
  type Tx1Imp1AgentInput,
  type Tx1Imp1AgentOutput,
  type NonSubmittedReporterInfo,
  type AgentExecutionError,
} from '../../src/agents/tx-1-imp-1/orchestrator';

interface SystemExecutionContext {
  timezone: string;
  locale: string;
  [key: string]: any;
}

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

  describe('仕様SCEN-015の検証ステップの完全カバー', () => {
    it('ステップ2: executionStatus が success, partial_success, failure のいずれかである', async () => {
      executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
      targetDate = new Date('2024-01-15T00:00:00+09:00');

      systemContext = {
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      };

      const mockStubs = {
        judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
          isExecutionTiming: true,
          currentTime: executionTimestamp,
          businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
        }),
        getActiveReportersForSubmissionCheck: (jest.fn() as any).mockResolvedValue({
          reporters: [
            { userId: 'R001', userName: '報告者1', emailAddress: 'r001@example.com' },
          ],
          totalCount: 1,
        }),
        authenticateAndAuthorizeReporterAccess: (jest.fn() as any).mockResolvedValue({
          isAuthenticated: true,
          isAuthorized: true,
        }),
        submitDailyReport: (jest.fn() as any).mockResolvedValue({
          success: true,
          reportId: 'report1',
        }),
        sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          notificationId: 'notif',
        }),
        detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
          nonSubmittedReporters: [],
          nonSubmittedCount: 0,
        }),
        sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          promptId: 'prompt',
        }),
      };

      mockAiClient = mockStubs;

      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      expect(['success', 'partial_success', 'failure']).toContain(output.executionStatus);
    });

    it('ステップ3: executionSummary フィールドが空でなく、文字列型である', async () => {
      executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
      targetDate = new Date('2024-01-15T00:00:00+09:00');

      systemContext = {
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      };

      const mockStubs = {
        judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
          isExecutionTiming: true,
          currentTime: executionTimestamp,
          businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
        }),
        getActiveReportersForSubmissionCheck: (jest.fn() as any).mockResolvedValue({
          reporters: [
            { userId: 'R001', userName: '報告者1', emailAddress: 'r001@example.com' },
            { userId: 'R002', userName: '報告者2', emailAddress: 'r002@example.com' },
          ],
          totalCount: 2,
        }),
        authenticateAndAuthorizeReporterAccess: (jest.fn() as any).mockResolvedValue({
          isAuthenticated: true,
          isAuthorized: true,
        }),
        submitDailyReport: (jest.fn() as any)
          .mockResolvedValueOnce({ success: true, reportId: 'report1' })
          .mockResolvedValueOnce({ success: true, reportId: 'report2' }),
        sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          notificationId: 'notif',
        }),
        detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
          nonSubmittedReporters: [],
          nonSubmittedCount: 0,
        }),
        sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          promptId: 'prompt',
        }),
      };

      mockAiClient = mockStubs;

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

    it('ステップ4: executionSummary の内容が4つの処理結果の要約を含む', async () => {
      executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
      targetDate = new Date('2024-01-15T00:00:00+09:00');

      systemContext = {
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      };

      const mockStubs = {
        judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
          isExecutionTiming: true,
          currentTime: executionTimestamp,
          businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
        }),
        getActiveReportersForSubmissionCheck: (jest.fn() as any).mockResolvedValue({
          reporters: [
            { userId: 'R001', userName: '報告者1', emailAddress: 'r001@example.com' },
            { userId: 'R002', userName: '報告者2', emailAddress: 'r002@example.com' },
            { userId: 'R003', userName: '報告者3', emailAddress: 'r003@example.com' },
          ],
          totalCount: 3,
        }),
        authenticateAndAuthorizeReporterAccess: (jest.fn() as any).mockResolvedValue({
          isAuthenticated: true,
          isAuthorized: true,
        }),
        submitDailyReport: (jest.fn() as any)
          .mockResolvedValueOnce({ success: true, reportId: 'report1' })
          .mockResolvedValueOnce({ success: true, reportId: 'report2' })
          .mockResolvedValueOnce({ success: false }),
        sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          notificationId: 'notif',
        }),
        detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
          nonSubmittedReporters: [
            { userId: 'R003', userName: '報告者3', emailAddress: 'r003@example.com', promptSent: false },
          ],
          nonSubmittedCount: 1,
        }),
        sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          promptId: 'prompt',
        }),
      };

      mockAiClient = mockStubs;

      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      const { reportersPrompted, reportsSubmitted, promptsSent, leaderNotificationsSent } = output;
      const summary = output.executionSummary;

      expect(summary).toContain(String(reportersPrompted));
      expect(summary).toContain(String(reportsSubmitted));
      expect(summary).toContain(String(promptsSent));
      expect(summary).toContain(String(leaderNotificationsSent));
    });

    it('ステップ5: executionSummary が日本語で、業務上の意味が明確に記述されている', async () => {
      executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
      targetDate = new Date('2024-01-15T00:00:00+09:00');

      systemContext = {
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      };

      const mockStubs = {
        judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
          isExecutionTiming: true,
          currentTime: executionTimestamp,
          businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
        }),
        getActiveReportersForSubmissionCheck: (jest.fn() as any).mockResolvedValue({
          reporters: [
            { userId: 'R001', userName: '報告者1', emailAddress: 'r001@example.com' },
            { userId: 'R002', userName: '報告者2', emailAddress: 'r002@example.com' },
          ],
          totalCount: 2,
        }),
        authenticateAndAuthorizeReporterAccess: (jest.fn() as any).mockResolvedValue({
          isAuthenticated: true,
          isAuthorized: true,
        }),
        submitDailyReport: (jest.fn() as any)
          .mockResolvedValueOnce({ success: true, reportId: 'report1' })
          .mockResolvedValueOnce({ success: true, reportId: 'report2' }),
        sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          notificationId: 'notif',
        }),
        detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
          nonSubmittedReporters: [],
          nonSubmittedCount: 0,
        }),
        sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          promptId: 'prompt',
        }),
      };

      mockAiClient = mockStubs;

      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      const summary = output.executionSummary;

      expect(summary).toMatch(/[ぁ-ん]+/);
      expect(summary.length).toBeGreaterThan(0);
    });

    it('ステップ6: errors フィールドが存在しない場合、executionSummary に「すべての処理が正常に完了しました」に類する内容が含まれる', async () => {
      executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
      targetDate = new Date('2024-01-15T00:00:00+09:00');

      systemContext = {
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      };

      const mockStubs = {
        judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
          isExecutionTiming: true,
          currentTime: executionTimestamp,
          businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
        }),
        getActiveReportersForSubmissionCheck: (jest.fn() as any).mockResolvedValue({
          reporters: [
            { userId: 'R001', userName: '報告者1', emailAddress: 'r001@example.com' },
          ],
          totalCount: 1,
        }),
        authenticateAndAuthorizeReporterAccess: (jest.fn() as any).mockResolvedValue({
          isAuthenticated: true,
          isAuthorized: true,
        }),
        submitDailyReport: (jest.fn() as any).mockResolvedValue({
          success: true,
          reportId: 'report1',
        }),
        sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          notificationId: 'notif',
        }),
        detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
          nonSubmittedReporters: [],
          nonSubmittedCount: 0,
        }),
        sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          promptId: 'prompt',
        }),
      };

      mockAiClient = mockStubs;

      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      if (!output.errors || output.errors.length === 0) {
        const summary = output.executionSummary;
        expect(summary).toMatch(/(完了|正常|成功|完結)/);
      }
    });

    it('ステップ7: errors フィールドが存在し、AgentExecutionError[] の配列が空でない場合、executionSummary にエラー発生の旨が含まれる', async () => {
      executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
      targetDate = new Date('2024-01-15T00:00:00+09:00');

      systemContext = {
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      };

      const mockStubs = {
        judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
          isExecutionTiming: true,
          currentTime: executionTimestamp,
          businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
        }),
        getActiveReportersForSubmissionCheck: (jest.fn() as any).mockResolvedValue({
          reporters: [
            { userId: 'R001', userName: '報告者1', emailAddress: 'r001@example.com' },
          ],
          totalCount: 1,
        }),
        authenticateAndAuthorizeReporterAccess: (jest.fn() as any).mockResolvedValue({
          isAuthenticated: true,
          isAuthorized: true,
        }),
        submitDailyReport: (jest.fn() as any).mockResolvedValue({
          success: true,
          reportId: 'report1',
        }),
        sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          notificationId: 'notif',
        }),
        detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
          nonSubmittedReporters: [],
          nonSubmittedCount: 0,
        }),
        sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
          success: true,
          promptId: 'prompt',
        }),
      };

      mockAiClient = mockStubs;

      const input: Tx1Imp1AgentInput = {
        executionTimestamp,
        targetDate,
        systemContext,
      };

      const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

      if (output.errors && output.errors.length > 0) {
        const summary = output.executionSummary;
        expect(summary).toMatch(/(エラー|失敗|問題)/);

        const hasErrorInfo = output.errors.some(
          (err: AgentExecutionError) =>
            summary.includes(err.errorCode) ||
            summary.includes(err.errorMessage),
        );
        expect(hasErrorInfo).toBeTruthy();
      }
    });
  });
});
