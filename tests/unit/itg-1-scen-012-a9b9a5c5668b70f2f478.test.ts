import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

// Type definitions for the agent
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

// Import the actual function from orchestrator
import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-012: runTx1Imp1Agent reports correct counts', () => {
  let mockAiClient: any;
  let systemContext: SystemExecutionContext;
  let executionTimestamp: Date;
  let targetDate: Date;

  beforeEach(() => {
    // 業務終了時刻（17:00）を基準とした executionTimestamp を設定
    executionTimestamp = new Date('2024-01-15T17:00:00+09:00');

    // 対象営業日の targetDate を設定
    targetDate = new Date('2024-01-15T00:00:00+09:00');

    // システムコンテキスト（認証情報、タイムゾーン、ロケール）を準備
    systemContext = {
      timezone: 'Asia/Tokyo',
      locale: 'ja-JP',
    };

    // スタブ judgeSchedulerExecutionTiming - 業務終了時刻の判定が成功
    const judgeSchedulerExecutionTimingStub = (jest.fn() as any).mockResolvedValue({
      isExecutionTiming: true,
      currentTime: executionTimestamp,
      businessEndTime: new Date('2024-01-15T17:00:00+09:00'),
    });

    // スタブ getActiveReportersForSubmissionCheck - アクティブな報告者5名
    const getActiveReportersStub = (jest.fn() as any).mockResolvedValue({
      reporters: [
        { userId: 'user1', userName: '員工1', email: 'user1@example.com' },
        { userId: 'user2', userName: '員工2', email: 'user2@example.com' },
        { userId: 'user3', userName: '員工3', email: 'user3@example.com' },
        { userId: 'user4', userName: '員工4', email: 'user4@example.com' },
        { userId: 'user5', userName: '員工5', email: 'user5@example.com' },
      ],
      totalCount: 5,
    });

    // スタブ authenticateAndAuthorizeReporterAccess - 全員の認証・認可が成功
    const authenticateStub = (jest.fn() as any).mockResolvedValue({
      isAuthenticated: true,
      isAuthorized: true,
    });

    // スタブ submitDailyReport - 3件提出
    const submitDailyReportStub = (jest.fn() as any)
      .mockResolvedValueOnce({ success: true, reportId: 'report1' })
      .mockResolvedValueOnce({ success: true, reportId: 'report2' })
      .mockResolvedValueOnce({ success: true, reportId: 'report3' })
      .mockResolvedValueOnce({ success: false, error: 'User not submitted' })
      .mockResolvedValueOnce({ success: false, error: 'User not submitted' });

    // スタブ sendLeaderSubmissionNotification - 提出通知3件
    const sendLeaderNotificationStub = (jest.fn() as any).mockResolvedValue({
      success: true,
      notificationId: 'notif',
    });

    // スタブ detectNonSubmittedReportersAtDeadline - 未提出者2名を検知
    const detectNonSubmittedStub = (jest.fn() as any).mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'user4', userName: '員工4', emailAddress: 'user4@example.com' },
        { userId: 'user5', userName: '員工5', emailAddress: 'user5@example.com' },
      ],
      nonSubmittedCount: 2,
    });

    // スタブ sendLeaderNonSubmissionPromptNotification - 催促メール2件
    const sendPromptNotificationStub = (jest.fn() as any).mockResolvedValue({
      success: true,
      promptId: 'prompt',
    });

    // AI クライアントモックの構成
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

  it('should return correct counts: reportersPrompted=5, reportsSubmitted=3', async () => {
    // runTx1Imp1Agent を入力型 Tx1Imp1AgentInput で直接呼び出す
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // 出力型 Tx1Imp1AgentOutput の reportersPrompted フィールド値が 5 と一致することを検証
    expect(output.reportersPrompted).toBe(5);

    // 出力型 Tx1Imp1AgentOutput の reportsSubmitted フィールド値が 3 と一致することを検証
    expect(output.reportsSubmitted).toBe(3);
  });

  it('should return correct execution status and non-submitted reporters', async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // 出力型 Tx1Imp1AgentOutput の executionStatus が 'partial_success' または 'success' であることを検証
    expect(['partial_success', 'success']).toContain(output.executionStatus);

    // 出力型 Tx1Imp1AgentOutput の nonSubmittedReporters 配列の長さが 2 であることを検証
    expect(output.nonSubmittedReporters).toHaveLength(2);
  });

  it('should send correct number of prompts and leader notifications', async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // 出力型 Tx1Imp1AgentOutput の promptsSent フィールド値が 2 と一致することを検証
    expect(output.promptsSent).toBe(2);

    // 出力型 Tx1Imp1AgentOutput の leaderNotificationsSent フィールド値が 3 と一致することを検証
    expect(output.leaderNotificationsSent).toBe(3);
  });

  it('should return empty errors array on successful execution', async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // 出力型 Tx1Imp1AgentOutput の errors 配列が空であることを検証
    expect(output.errors).toEqual([]);
  });

  it('should verify the complete flow with all expected counts', async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      targetDate,
      systemContext,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // 対象報告者数（5名）と実際の提出数（3名）が正確に追跡されたことを確認
    expect(output.reportersPrompted).toBe(5);
    expect(output.reportsSubmitted).toBe(3);

    // 未提出者への催促（2件）が実行されたことを確認
    expect(output.promptsSent).toBe(2);
    expect(output.nonSubmittedReporters).toHaveLength(2);

    // リーダーへの通知が3件送信されたことを確認
    expect(output.leaderNotificationsSent).toBe(3);

    // 実行ステータスが成功または部分成功であることを確認
    expect(['partial_success', 'success']).toContain(output.executionStatus);

    // エラーが発生していないことを確認
    expect(output.errors || []).toEqual([]);
  });
});
