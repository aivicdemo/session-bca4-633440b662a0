import {
  runTx3Imp1Agent,
  Tx3Imp1AiClient,
} from '../../src/agents/tx-3-imp-1/orchestrator';

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

import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import {
  detectNonSubmittedReportersAtDeadline,
  generateNonSubmissionDetectionResult,
} from '../../src/logic/daily-report-non-submission-detection';
import {
  judgePromptNecessityAndMethod,
} from '../../src/logic/non-submission-prompt-decision';
import {
  sendLeaderNonSubmissionPromptNotification,
} from '../../src/logic/daily-report-reminder-notification';
import {
  sendNonSubmissionPromptNotification,
} from '../../src/logic/email-notification-management';
import {
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import {
  retrieveLeaderDashboardData,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-026: 代表的な正常入力で未提出者検知・リーダー通知・催促メール送信がすべて完了する', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705324800000; // 2024-01-15 09:00:00 UTC
  const leaderUserIds = ['leader-001', 'leader-002'];
  const mockAiClient: Tx3Imp1AiClient = {
    invokeModel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks as per test specification
    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue({
      isSchedulerTimingValid: true,
    });

    const nonSubmittedReporters = [
      { reporterId: 'reporter-001', reporterName: 'Reporter 1' },
      { reporterId: 'reporter-002', reporterName: 'Reporter 2' },
      { reporterId: 'reporter-003', reporterName: 'Reporter 3' },
    ];

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockReturnValue({
      detectionLogId: 'detection-log-001',
      nonSubmittedReporters,
      detectionTimestamp: executionTimestamp,
    });

    (generateNonSubmissionDetectionResult as jest.Mock).mockReturnValue({
      detectionLogId: 'detection-log-001',
      targetDate,
      detectionTimestamp: executionTimestamp,
      totalReporterCount: 10,
      submittedCount: 7,
      nonSubmittedCount: 3,
      nonSubmittedReporters,
    });

    (judgePromptNecessityAndMethod as jest.Mock).mockReturnValue({
      isPromptNecessary: true,
      promptMethod: 'email_notification',
      promptPriority: 'high',
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockReturnValue([
      { status: 'success', leaderUserId: 'leader-001', sentTimestamp: executionTimestamp },
      { status: 'success', leaderUserId: 'leader-002', sentTimestamp: executionTimestamp },
    ]);

    (sendNonSubmissionPromptNotification as jest.Mock).mockReturnValue([
      { status: 'success', reporterId: 'reporter-001', sentTimestamp: executionTimestamp },
      { status: 'success', reporterId: 'reporter-002', sentTimestamp: executionTimestamp },
      { status: 'success', reporterId: 'reporter-003', sentTimestamp: executionTimestamp },
    ]);

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockReturnValue({
      submittedReports: [
        { reporterId: 'reporter-004', submissionTimestamp: executionTimestamp - 3600000 },
        { reporterId: 'reporter-005', submissionTimestamp: executionTimestamp - 7200000 },
        { reporterId: 'reporter-006', submissionTimestamp: executionTimestamp - 10800000 },
        { reporterId: 'reporter-007', submissionTimestamp: executionTimestamp - 14400000 },
        { reporterId: 'reporter-008', submissionTimestamp: executionTimestamp - 18000000 },
        { reporterId: 'reporter-009', submissionTimestamp: executionTimestamp - 21600000 },
        { reporterId: 'reporter-010', submissionTimestamp: executionTimestamp - 25200000 },
      ],
    });

    (retrieveLeaderDashboardData as jest.Mock).mockReturnValue({
      targetDate,
      totalReporterCount: 10,
      submittedCount: 7,
      nonSubmittedCount: 3,
      notificationSentToLeaders: true,
      leaderNotificationCount: 2,
      promptEmailSentToReporters: true,
      reporterPromptCount: 3,
      lastExecutionTimestamp: executionTimestamp,
    });
  });

  test('should complete all operations successfully with normal input', async () => {
    const result = await runTx3Imp1Agent({
      targetDate,
      executionTimestamp,
      leaderUserIds,
    }, mockAiClient);

    // Validate executionStatus
    expect(result.executionStatus).toBe('success');

    // Validate detectionResult
    expect(result.detectionResult).toBeDefined();
    expect(result.detectionResult.targetDate).toBe(targetDate);
    expect(result.detectionResult.nonSubmittedCount).toBe(3);

    // Validate leaderNotificationStatus
    expect(result.leaderNotificationStatus).toBeDefined();
    expect(Array.isArray(result.leaderNotificationStatus)).toBe(true);
    expect(result.leaderNotificationStatus).toHaveLength(2);
    expect(result.leaderNotificationStatus[0].status).toBe('success');
    expect(result.leaderNotificationStatus[1].status).toBe('success');

    // Validate promptNotificationStatus
    expect(result.promptNotificationStatus).toBeDefined();
    expect(Array.isArray(result.promptNotificationStatus)).toBe(true);
    expect(result.promptNotificationStatus).toHaveLength(3);
    expect(result.promptNotificationStatus[0].status).toBe('success');
    expect(result.promptNotificationStatus[1].status).toBe('success');
    expect(result.promptNotificationStatus[2].status).toBe('success');

    // Validate dashboardData
    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData.targetDate).toBe(targetDate);
    expect(result.dashboardData.nonSubmittedCount).toBe(3);

    // Validate executionTimestamp
    expect(typeof result.executionTimestamp).toBe('number');
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
    expect(result.executionTimestamp).toBeLessThanOrEqual(Date.now());

    // Verify all dependencies were called
    expect(judgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(detectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(generateNonSubmissionDetectionResult).toHaveBeenCalled();
    expect(judgePromptNecessityAndMethod).toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(sendNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(retrieveDailyReportsForLeaderReview).toHaveBeenCalled();
    expect(retrieveLeaderDashboardData).toHaveBeenCalled();
  });
});
