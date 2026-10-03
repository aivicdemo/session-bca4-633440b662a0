import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as detectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecisionModule from '../../src/logic/non-submission-prompt-decision';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';
import * as emailModule from '../../src/logic/email-notification-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as dashboardModule from '../../src/logic/daily-report-management-view';

describe('SCEN-026: 正常系: 未提出者検知・リーダー通知・催促メール送信がすべて完了', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705324800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(businessDayModule.judgeSchedulerExecutionTiming).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '定時実行タイミング',
    } as any);

    jest.mocked(detectionModule.detectNonSubmittedReportersAtDeadline).mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'u001', userName: '未提出者1', emailAddress: 'u001@example.com', reporterName: '未提出者1', department: '営業部', promptPriority: 'high' },
        { userId: 'u002', userName: '未提出者2', emailAddress: 'u002@example.com', reporterName: '未提出者2', department: '営業部', promptPriority: 'high' },
        { userId: 'u003', userName: '未提出者3', emailAddress: 'u003@example.com', reporterName: '未提出者3', department: '開発部', promptPriority: 'medium' },
      ],
      detectionLog: {
        detectionLogId: 'det-log-20240115-001',
        targetDate,
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 10,
        nonSubmittedCount: 3,
        submittedCount: 7,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    } as any);

    (jest.mocked(detectionModule.generateNonSubmissionDetectionResult) as any).mockResolvedValue({
      dashboardDisplayData: {},
      promptNotificationData: {},
    });

    jest.mocked(promptDecisionModule.judgePromptNecessityAndMethod).mockResolvedValue({
      isPromptNecessary: true,
      promptPriority: 'high',
      promptMethod: 'email',
      estimatedNonSubmissionReason: 'input_forgotten',
      suggestedPromptMessage: '日報をお願いします',
      overdueDurationMinutes: 120,
    } as any);

    jest.mocked(notificationModule.sendLeaderNonSubmissionPromptNotification).mockResolvedValue({
      success: true,
      notificationId: 'notif-001',
      sentAt: new Date(executionTimestamp),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 3,
      errorDetails: null,
    } as any);

    jest.mocked(emailModule.sendNonSubmissionPromptNotification).mockResolvedValue({
      success: true,
      totalTargets: 3,
      successCount: 3,
      failureCount: 0,
      emailSendingHistoryIds: [],
      sentAt: new Date(executionTimestamp).toISOString(),
    } as any);

    jest.mocked(persistenceModule.retrieveDailyReportsForLeaderReview).mockResolvedValue({
      dailyReports: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 20,
      retrievedAt: new Date(executionTimestamp).toISOString(),
    } as any);

    jest.mocked(dashboardModule.retrieveLeaderDashboardData).mockResolvedValue({
      submittedReports: [],
      nonSubmittedReporters: [],
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 10,
        submittedCount: 7,
        nonSubmittedCount: 3,
        reminderSentCount: 3,
        submissionRate: 70,
      },
    } as any);
  });

  it('実行状態: success、すべての処理が呼び出される', async () => {
    const input = { targetDate, executionTimestamp, leaderUserIds };
    const output = await runTx3Imp1Agent(input, {} as Tx3Imp1AiClient);

    expect(output.executionStatus).toBe('success');
    expect(output.detectionResult).toBeDefined();
    expect(Array.isArray(output.leaderNotificationStatus)).toBe(true);
    expect(Array.isArray(output.promptNotificationStatus)).toBe(true);
    expect(output.dashboardData).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('number');
  });
});
