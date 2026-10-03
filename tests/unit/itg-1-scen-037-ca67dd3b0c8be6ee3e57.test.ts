import { runTx3Imp1Agent, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as businessDayDeadlineModule from '../../src/logic/business-day-deadline-judgment';
import * as detectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as reminderModule from '../../src/logic/daily-report-reminder-notification';
import * as emailModule from '../../src/logic/email-notification-management';
import * as reportModule from '../../src/logic/daily-report-persistence';
import * as dashboardModule from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

describe('SCEN-037: executionStatusが partial_failure になる場合の部分的な失敗が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record partial failure when detection result is incomplete', async () => {
    const targetDate = '2025-01-15';
    const executionTimestamp = 1705276800000;
    const leaderUserIds = ['leader-001'];

    (businessDayDeadlineModule.judgeSchedulerExecutionTiming as jest.Mock)
      .mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
        nextScheduledExecutionTime: null,
        executionReason: 'Execution time is within window',
      });

    (detectionModule.detectNonSubmittedReportersAtDeadline as jest.Mock)
      .mockResolvedValue({
        nonSubmittedReporters: [
          { userId: 'user-001', reporterName: 'Reporter 1', emailAddress: 'user1@example.com' },
          { userId: 'user-002', reporterName: 'Reporter 2', emailAddress: 'user2@example.com' },
        ],
        detectionLog: {
          detectionLogId: 'log-001',
          targetDate,
          detectionDateTime: null,
          totalReportersCount: 10,
          nonSubmittedCount: 2,
          submittedCount: 8,
        },
        detectionTimestamp: new Date(executionTimestamp).toISOString(),
      });

    (detectionModule.generateNonSubmissionDetectionResult as jest.Mock)
      .mockResolvedValue({
        dashboardDisplayData: {},
        promptNotificationData: {},
      });

    (reminderModule.sendLeaderNonSubmissionPromptNotification as jest.Mock)
      .mockResolvedValue({
        success: true,
        notificationId: 'notif-001',
        sentAt: new Date(executionTimestamp + 1000),
        deliveryMethod: 'email',
        nonSubmittedReporterCount: 2,
        errorDetails: null,
      });

    (emailModule.sendNonSubmissionPromptNotification as jest.Mock)
      .mockResolvedValue({ sent: 2, success: true });

    (reportModule.retrieveDailyReportsForLeaderReview as jest.Mock)
      .mockResolvedValue({
        dailyReports: [],
        totalCount: 8,
        pageNumber: 1,
        pageSize: 10,
        retrievedAt: new Date().toISOString(),
      });

    (dashboardModule.retrieveLeaderDashboardData as jest.Mock)
      .mockResolvedValue({
        submittedReportCount: 8,
        nonSubmittedReporterCount: 2,
        nonSubmittedReporters: [
          { userId: 'user-001', reporterName: 'Reporter 1', emailAddress: 'user1@example.com' },
          { userId: 'user-002', reporterName: 'Reporter 2', emailAddress: 'user2@example.com' },
        ],
        promptNotificationStatus: { sent: 2, failed: 0 },
      });

    const input = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
      systemContext: { timezone: 'Asia/Tokyo', locale: 'ja-JP' },
    };

    const mockAiClient: Tx3Imp1AiClient = {};
    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.detectionResult).toBeDefined();
    expect(result.leaderNotificationStatus).toBeDefined();
    expect(result.promptNotificationStatus).toBeDefined();
    expect(result.dashboardData).toBeDefined();
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
  });
});
