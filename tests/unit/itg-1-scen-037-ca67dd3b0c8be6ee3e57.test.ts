jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
  generateNonSubmissionDetectionResult: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  retrieveLeaderDashboardData: jest.fn(),
}));

import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import {
  detectNonSubmittedReportersAtDeadline,
  generateNonSubmissionDetectionResult,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedGenerateNonSubmissionDetectionResult = generateNonSubmissionDetectionResult as jest.Mock;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.Mock;

// SCEN-037の期待結果が言及する「検知日時」フィールドは、詳細設計上 Tx3Imp1AgentOutput.detectionResult の型
// NonSubmissionDetectionResult（nonSubmittedReporterIds / detectionLogId / detectionCount のみ）には定義がない。
// 同モジュールが公開する DetectionLogSummary 型の detectionTimestamp フィールドが最も近い対応語であるため、
// このテストでは検知結果側の欠落した検知日時をこのフィールド名で表現した。詳細は
// .aivic/batches/33/unresolved.md の SCEN-037 の項を参照。

describe('SCEN-037: executionStatusが partial_failure になる場合の部分的な失敗が記録される', () => {
  const targetDate = '2025-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001'];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      executionReason: '営業日の実行時刻内',
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'U001', userName: '報告者1', emailAddress: 'u001@example.com', promptPriority: 'high' },
        { userId: 'U002', userName: '報告者2', emailAddress: null, promptPriority: 'medium' },
      ],
      detectionLog: {
        detectionLogId: 'LOG-PARTIAL-001',
        targetDate,
        detectionTimestamp: null,
        nonSubmittedCount: 2,
      },
      partialFailure: true,
      failedReporterIds: ['U002'],
    });

    mockedGenerateNonSubmissionDetectionResult.mockResolvedValue({
      nonSubmittedReporterIds: ['U001', 'U002'],
      detectionLogId: 'LOG-PARTIAL-001',
      detectionCount: 2,
      detectionTimestamp: null,
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      promptNecessary: true,
      promptMethod: 'email',
      priority: 'high',
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      recipientUserId: 'leader-001',
      notificationType: 'leader_notification',
      sendStatus: 'success',
      emailSendingHistoryId: 'HIST-LEADER-001',
      errorMessage: null,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue([
      {
        recipientUserId: 'U001',
        notificationType: 'prompt_notification',
        sendStatus: 'success',
        emailSendingHistoryId: 'HIST-PROMPT-001',
        errorMessage: null,
      },
      {
        recipientUserId: 'U002',
        notificationType: 'prompt_notification',
        sendStatus: 'success',
        emailSendingHistoryId: 'HIST-PROMPT-002',
        errorMessage: null,
      },
    ]);

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: [
        { reportId: 'DR-001', userId: 'U003', userName: '報告者3', submissionTimestamp: 1705276000000 },
      ],
      totalCount: 1,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReportCount: 1,
      nonSubmittedReporterCount: 2,
      nonSubmittedReporters: [
        { userId: 'U001', userName: '報告者1', emailAddress: 'u001@example.com', promptPriority: 'high' },
        { userId: 'U002', userName: '報告者2', emailAddress: null, promptPriority: 'medium' },
      ],
      promptNotificationStatus: { sent: 2, failed: 0 },
    });
  });

  it('検知日時が欠落した部分的な検知結果を保持しつつ executionStatus が partial_failure になる', async () => {
    const result = await runTx3Imp1Agent({
      targetDate,
      executionTimestamp,
      leaderUserIds,
    });

    expect(result.executionStatus).toBe('partial_failure');

    expect(result.detectionResult.nonSubmittedReporterIds).toEqual(['U001', 'U002']);
    expect(result.detectionResult.detectionLogId).toBe('LOG-PARTIAL-001');
    expect(result.detectionResult.detectionTimestamp ?? null).toBeNull();

    expect(result.leaderNotificationStatus.length).toBeGreaterThan(0);
    expect(
      result.leaderNotificationStatus.every((status: any) => status.sendStatus === 'success')
    ).toBe(true);

    expect(result.promptNotificationStatus.length).toBeGreaterThan(0);
    expect(
      result.promptNotificationStatus.every((status: any) => status.sendStatus === 'success')
    ).toBe(true);

    expect(result.dashboardData.nonSubmittedReporterCount).toBe(2);
    expect(result.dashboardData.nonSubmittedReporters).toHaveLength(2);

    expect(result.executionTimestamp).toBeGreaterThan(executionTimestamp);
  });
});
