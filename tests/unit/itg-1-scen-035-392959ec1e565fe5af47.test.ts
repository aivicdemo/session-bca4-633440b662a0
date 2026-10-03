import { runTx3Imp1Agent, LeaderNotificationFailure, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
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

describe('SCEN-035: リーダー通知に失敗した場合でも未提出者への催促メールが送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send prompt notifications even when leader notification fails', async () => {
    const targetDate = '2024-01-15';
    const executionTimestamp = 1705276800000;
    const leaderUserIds = ['leader001', 'leader002'];

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
          { userId: 'user-002', reporterName: 'Reporter 2', emailAddress: 'user2@example.com' },
          { userId: 'user-003', reporterName: 'Reporter 3', emailAddress: 'user3@example.com' },
        ],
        detectionLog: {
          detectionLogId: 'log-001',
          targetDate,
          detectionDateTime: new Date(executionTimestamp).toISOString(),
          totalReportersCount: 5,
          nonSubmittedCount: 2,
          submittedCount: 3,
        },
        detectionTimestamp: new Date(executionTimestamp).toISOString(),
      });

    (detectionModule.generateNonSubmissionDetectionResult as jest.Mock)
      .mockResolvedValue({
        dashboardDisplayData: {},
        promptNotificationData: {},
      });

    (reminderModule.sendLeaderNonSubmissionPromptNotification as jest.Mock)
      .mockRejectedValue(new LeaderNotificationFailure('リーダーへの通知送信に失敗しました。'));

    (emailModule.sendNonSubmissionPromptNotification as jest.Mock)
      .mockResolvedValue({ sent: 2, success: true });

    (reportModule.retrieveDailyReportsForLeaderReview as jest.Mock)
      .mockResolvedValue({
        dailyReports: [],
        totalCount: 3,
        pageNumber: 1,
        pageSize: 10,
        retrievedAt: new Date().toISOString(),
      });

    (dashboardModule.retrieveLeaderDashboardData as jest.Mock)
      .mockResolvedValue({
        submittedReportCount: 3,
        nonSubmittedReporterCount: 2,
        nonSubmittedReporters: [
          { userId: 'user-002', reporterName: 'Reporter 2', emailAddress: 'user2@example.com' },
          { userId: 'user-003', reporterName: 'Reporter 3', emailAddress: 'user3@example.com' },
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

    expect(result.executionStatus).toBe('partial_success');
    expect(result.detectionResult).toBeDefined();
    expect(result.leaderNotificationStatus).toHaveLength(0);
    expect(result.promptNotificationStatus).toBeDefined();
    expect(result.dashboardData).toBeDefined();
  });
});
