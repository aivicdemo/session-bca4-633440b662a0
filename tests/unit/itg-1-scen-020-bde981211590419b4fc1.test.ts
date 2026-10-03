import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-020: 提出期限に達した対象日付で、一部の報告者が未提出の場合', () => {
  it('検知結果に未提出者が含まれ、催促メール送信レコードが生成される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      }),
      detectNonSubmittedReportersAtDeadline: (jest.fn() as any).mockResolvedValue({
        nonSubmittedReporterIds: ['user-002', 'user-004'],
        detectionLogId: 'LOG-001',
        detectionCount: 2,
      }),
      judgePromptNecessityAndMethod: (jest.fn() as any).mockResolvedValue({
        isPromptNecessary: true,
        promptMethod: 'email',
      }),
      sendLeaderNonSubmissionPromptNotification: (jest.fn() as any).mockResolvedValue({
        sent: true,
        notificationId: 'NOTIF-002',
      }),
      sendLeaderSubmissionNotification: (jest.fn() as any).mockResolvedValue({
        leaderUserId: 'leader-001',
        emailSendingHistoryId: 'EMAIL-LEADER-001',
        sendingStatus: 'success',
        sentTimestamp: 1705315200000,
      }),
      retrieveLeaderDashboardData: (jest.fn() as any).mockResolvedValue({
        submittedReportCount: 3,
        nonSubmittedReporterCount: 2,
        nonSubmittedReporters: [
          { userId: 'user-002', userName: '報告者2', emailAddress: 'r002@example.com', departmentId: 'D001', promptSent: false },
          { userId: 'user-004', userName: '報告者4', emailAddress: 'r004@example.com', departmentId: 'D001', promptSent: false },
        ],
        promptNotificationStatus: { sent: 2, failed: 0 },
      }),
    };

    const input: Tx2Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705315200000,
      leaderUserIds: ['leader-001'],
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.detectionResult.detectionCount).toBe(2);
    expect(result.detectionResult.nonSubmittedReporterIds).toEqual(['user-002', 'user-004']);
    expect(result.leaderNotificationsSent.length).toBeGreaterThanOrEqual(1);
    expect(result.dashboardData.submittedReportCount).toBe(3);
    expect(result.dashboardData.nonSubmittedReporterCount).toBe(2);
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(1705315200000);
  });
});
