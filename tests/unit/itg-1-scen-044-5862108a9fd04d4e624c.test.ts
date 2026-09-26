import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/daily-report-management-view');
jest.mock('../../src/logic/email-notification-management');

import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterModule from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as detectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecisionModule from '../../src/logic/non-submission-prompt-decision';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';
import * as dashboardModule from '../../src/logic/daily-report-management-view';
import * as emailModule from '../../src/logic/email-notification-management';

describe('SCEN-044: チーム進捗サマリーの生成に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieveLeaderDashboardDataがエラーを返すとき、executionStatusはfailureになる', async () => {
    const mockBusinessDay = businessDayModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
    const mockGetActiveReporters = reporterModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
    const mockRetrieveDailyReports = persistenceModule.retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;
    const mockDetectNonSubmitted = detectionModule.detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;
    const mockJudgePromptNecessity = promptDecisionModule.judgePromptNecessityAndMethod as jest.MockedFunction<any>;
    const mockSendLeaderPrompt = notificationModule.sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
    const mockSendNonSubmissionPrompt = emailModule.sendNonSubmissionPromptNotification as jest.MockedFunction<any>;
    const mockRetrieveDashboard = dashboardModule.retrieveLeaderDashboardData as jest.MockedFunction<any>;

    mockBusinessDay.mockResolvedValue({ isBusinessDay: true, deadline: '2024-01-16T17:00:00Z' });

    mockGetActiveReporters.mockResolvedValue([
      { userId: 'reporter-001', userName: 'user-001', reporterName: '報告者1' },
      { userId: 'reporter-002', userName: 'user-002', reporterName: '報告者2' },
      { userId: 'reporter-003', userName: 'user-003', reporterName: '報告者3' },
    ]);

    mockRetrieveDailyReports.mockResolvedValue([
      { userId: 'reporter-001', submittedAt: '2024-01-15T16:30:00Z' },
      { userId: 'reporter-002', submittedAt: '2024-01-15T16:45:00Z' },
    ]);

    mockDetectNonSubmitted.mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'reporter-003', userName: 'user-003', reporterName: '報告者3' },
      ],
      detectionLogId: 'log-001',
    });

    mockJudgePromptNecessity.mockResolvedValue({ needsPrompt: true });

    mockSendLeaderPrompt.mockResolvedValue(true);

    mockSendNonSubmissionPrompt.mockResolvedValue(1);

    mockRetrieveDashboard.mockRejectedValue(new Error('ダッシュボードデータ取得失敗'));

    const fakeAiClient: Tx4Imp1AiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate: '2024-01-15', leaderUserId: 'leader-001', teamId: 'team-001' },
      fakeAiClient,
    );

    expect(result.executionStatus).toBe('failure');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.submittedReportCount).toBe(2);
    expect(result.nonSubmittedReporterCount).toBe(1);
    expect(result.promptNotificationsSent).toBe(1);
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.errors).toBeDefined();
    const summaryError = result.errors?.find((e) => e.code === 'ProgressSummaryGenerationFailed');
    expect(summaryError).toBeDefined();
    expect(summaryError?.message).toBe('チーム進捗サマリーの生成に失敗しました。');
  });
});
