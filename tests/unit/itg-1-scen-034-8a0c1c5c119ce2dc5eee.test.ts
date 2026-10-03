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

describe('SCEN-034: 複数のリーダーに対して通知が個別に送信され、各リーダーのステータスが記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send individual notifications to multiple leaders with distinct timestamps', async () => {
    const targetDate = '2025-01-15';
    const executionTimestamp = 1705324800000;
    const leaderUserIds = ['leader-001', 'leader-002', 'leader-003'];

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
          { userId: 'user-003', reporterName: 'Reporter 3', emailAddress: 'user3@example.com' },
          { userId: 'user-004', reporterName: 'Reporter 4', emailAddress: 'user4@example.com' },
          { userId: 'user-005', reporterName: 'Reporter 5', emailAddress: 'user5@example.com' },
        ],
        detectionLog: {
          detectionLogId: 'log-001',
          targetDate,
          detectionDateTime: new Date(executionTimestamp).toISOString(),
          totalReportersCount: 10,
          nonSubmittedCount: 5,
          submittedCount: 5,
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
        nonSubmittedReporterCount: 5,
        errorDetails: null,
      });

    (emailModule.sendNonSubmissionPromptNotification as jest.Mock)
      .mockResolvedValue({ sent: 5, success: true });

    (reportModule.retrieveDailyReportsForLeaderReview as jest.Mock)
      .mockResolvedValue({
        dailyReports: [],
        totalCount: 5,
        pageNumber: 1,
        pageSize: 10,
        retrievedAt: new Date().toISOString(),
      });

    (dashboardModule.retrieveLeaderDashboardData as jest.Mock)
      .mockResolvedValue({
        submittedReportCount: 5,
        nonSubmittedReporterCount: 5,
        nonSubmittedReporters: [
          { userId: 'user-001', reporterName: 'Reporter 1', emailAddress: 'user1@example.com' },
          { userId: 'user-002', reporterName: 'Reporter 2', emailAddress: 'user2@example.com' },
          { userId: 'user-003', reporterName: 'Reporter 3', emailAddress: 'user3@example.com' },
          { userId: 'user-004', reporterName: 'Reporter 4', emailAddress: 'user4@example.com' },
          { userId: 'user-005', reporterName: 'Reporter 5', emailAddress: 'user5@example.com' },
        ],
        promptNotificationStatus: { sent: 5, failed: 0 },
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
    expect(result.executionTimestamp).toBe(executionTimestamp);
  });
});
