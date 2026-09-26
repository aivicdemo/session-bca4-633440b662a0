import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

import { runTx5Imp1Agent, type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.MockedFunction<any>;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;

describe('SCEN-060: リーダーへの検知結果通知が正常に送信されてフラグが真で記録される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
        { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
        { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
        { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
        { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active' },
        { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
      ],
      totalCount: 5,
      message: '対象報告者を取得しました。',
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: 'ユーザー1',
          emailAddress: 'u001@example.com',
          promptPriority: 'high',
        },
        {
          userId: 'U002',
          userName: 'ユーザー2',
          emailAddress: 'u002@example.com',
          promptPriority: 'medium',
        },
      ],
      detectionLog: {
        detectionLogId: 'detection-log-20240115-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T17:30:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 2,
        submittedCount: 3,
      },
      detectionTimestamp: '2024-01-15T17:30:00Z',
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptNecessary: true,
      promptPriority: 'high',
      promptMethod: 'email',
      estimatedNonSubmissionReason: 'input_forgotten',
      suggestedPromptMessage: 'メール送信が必要です',
      overdueDurationMinutes: 90,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'notif-20240115-001',
      sentAt: new Date('2024-01-15T17:30:00Z'),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 2,
      errorDetails: null,
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      detectionLogs: [
        {
          detectionLogId: 'detection-log-20240115-001',
          userId: 'U001',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T17:30:00Z',
          reminderSent: true,
          reminderSentDateTime: '2024-01-15T17:31:00Z',
          submissionStatus: 'not_submitted',
        },
        {
          detectionLogId: 'detection-log-20240115-002',
          userId: 'U002',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T17:30:00Z',
          reminderSent: true,
          reminderSentDateTime: '2024-01-15T17:31:00Z',
          submissionStatus: 'not_submitted',
        },
      ],
      totalCount: 2,
      retrievedAt: '2024-01-15T17:30:00Z',
    });
  });

  it('リーダー通知が成功し、leaderNotificationSent=trueでdetectionLogIdが記録される', async () => {
    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:30:00Z',
        executedBy: 'scheduler-001',
      },
    };

    const mockAiClient: Tx5Imp1AiClient = {};
    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.leaderNotificationSent).toBe(true);
    expect(result.detectionLogId).not.toBeNull();
    expect(result.detectionLogId).not.toBe('');
    expect(typeof result.detectionLogId).toBe('string');

    expect(result.executionStatus).toMatch(/^(success|partial_failure)$/);

    expect(result.errorDetails === null || Array.isArray(result.errorDetails)).toBe(true);

    expect(result.promptNotificationsSent).toBeDefined();
    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);

    for (const notification of result.promptNotificationsSent) {
      expect(notification.status).toBe('success');
    }

    if (result.nonSubmittedReporters && result.nonSubmittedReporters.length > 0) {
      const scheduledAtTime = new Date('2024-01-15T17:30:00Z').getTime();
      for (const reporter of result.nonSubmittedReporters) {
        const detectionTime = new Date(reporter.detectionTime).getTime();
        expect(detectionTime >= scheduledAtTime).toBe(true);
      }
    }
  });
});
