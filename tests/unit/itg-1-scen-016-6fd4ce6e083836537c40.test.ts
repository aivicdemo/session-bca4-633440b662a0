import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
  type Tx2Imp1AgentOutput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-016: 提出期限に達した対象日付で、全員が日報を提出済みの場合', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705315200000;
  const leaderUserIds = ['leader-001'];

  it('成功ステータスで実行完了し、未提出者なし・催促メール送信なし・リーダーに提出状況報告を送信する', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      }) as any,
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporterIds: [],
        detectionLogId: 'LOG-001',
        detectionCount: 0,
      }) as any,
      judgePromptNecessityAndMethod: jest.fn() as any,
      sendLeaderNonSubmissionPromptNotification: jest.fn() as any,
      sendLeaderSubmissionNotification: jest.fn().mockResolvedValue({
        leaderUserId: 'leader-001',
        emailSendingHistoryId: 'EMAIL-001',
        sendingStatus: 'success',
        sentTimestamp: executionTimestamp,
      }) as any,
      retrieveLeaderDashboardData: jest.fn().mockResolvedValue({
        submittedReportCount: 10,
        nonSubmittedReporterCount: 0,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 0, failed: 0 },
      }) as any,
    };

    const input: Tx2Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.detectionResult).toBeDefined();
    expect(result.detectionResult.nonSubmittedReporterIds).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.leaderNotificationsSent.length).toBeGreaterThanOrEqual(1);
    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData.submittedReportCount).toBe(10);
    expect(result.dashboardData.nonSubmittedReporterCount).toBe(0);
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);

    expect(mockAiClient.judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
