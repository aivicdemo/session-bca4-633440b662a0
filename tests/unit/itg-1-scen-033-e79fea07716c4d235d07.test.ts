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

describe('SCEN-033: 未提出者が0件の場合、空の一覧でリーダーに通知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute successfully with no non-submitted reporters', async () => {
    const targetDate = '2024-01-10';
    const executionTimestamp = 1704902400000;
    const leaderUserIds = ['leader-001', 'leader-002'];

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
        nonSubmittedReporters: [],
        detectionLog: {
          detectionLogId: 'log-001',
          targetDate,
          detectionDateTime: new Date(executionTimestamp).toISOString(),
          totalReportersCount: 5,
          nonSubmittedCount: 0,
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
        nonSubmittedReporterCount: 0,
        errorDetails: null,
      });

    (emailModule.sendNonSubmissionPromptNotification as jest.Mock)
      .mockResolvedValue({ sent: 0, success: true });

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
        nonSubmittedReporterCount: 0,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 0, failed: 0 },
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
    expect(result.leaderNotificationStatus).toHaveLength(0);
    expect(result.promptNotificationStatus).toHaveLength(0);
    expect(result.dashboardData).toBeDefined();
    expect(result.executionTimestamp).toBe(executionTimestamp);
  });
});
