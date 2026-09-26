import { runTx4Imp1Agent, type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

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

describe('SCEN-038: 全員提出 - 進捗サマリー生成成功', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日で全員が提出している場合、提出件数と進捗サマリーが生成される', async () => {
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
      { userId: 'reporter-004', userName: 'user-004', reporterName: '報告者4' },
      { userId: 'reporter-005', userName: 'user-005', reporterName: '報告者5' },
    ]);

    mockRetrieveDailyReports.mockResolvedValue([
      { userId: 'reporter-001', submittedAt: '2024-01-15T16:30:00Z' },
      { userId: 'reporter-002', submittedAt: '2024-01-15T16:45:00Z' },
      { userId: 'reporter-003', submittedAt: '2024-01-15T15:00:00Z' },
      { userId: 'reporter-004', submittedAt: '2024-01-15T16:00:00Z' },
      { userId: 'reporter-005', submittedAt: '2024-01-15T14:30:00Z' },
    ]);

    mockDetectNonSubmitted.mockResolvedValue({
      nonSubmittedReporters: [],
      detectionLogId: 'log-001',
    });

    mockJudgePromptNecessity.mockResolvedValue({ needsPrompt: false });

    mockSendLeaderPrompt.mockResolvedValue(true);

    mockSendNonSubmissionPrompt.mockResolvedValue(0);

    mockRetrieveDashboard.mockResolvedValue({
      progressSummary: '提出率100%、全員提出、未提出者なし',
    });

    const fakeAiClient: Tx4Imp1AiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate: '2024-01-15', leaderUserId: 'leader-001', teamId: 'team-A' },
      fakeAiClient,
    );

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.submittedReportCount).toBe(5);
    expect(result.nonSubmittedReporterCount).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toBe(0);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('提出率100%');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.detectionLogId).toBe('log-001');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.errors).toBeUndefined();
  });
});
