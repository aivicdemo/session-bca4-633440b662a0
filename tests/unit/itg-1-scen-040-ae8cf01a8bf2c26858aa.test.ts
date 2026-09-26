import { runTx4Imp1Agent, type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

jest.mock('../../../src/logic/business-day-deadline-judgment');
jest.mock('../../../src/logic/reporter-master-management');
jest.mock('../../../src/logic/daily-report-persistence');
jest.mock('../../../src/logic/daily-report-non-submission-detection');
jest.mock('../../../src/logic/non-submission-prompt-decision');
jest.mock('../../../src/logic/daily-report-reminder-notification');
jest.mock('../../../src/logic/daily-report-management-view');
jest.mock('../../src/logic/email-notification-management');

import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterModule from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as detectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecisionModule from '../../src/logic/non-submission-prompt-decision';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';
import * as dashboardModule from '../../src/logic/daily-report-management-view';
import * as emailModule from '../../src/logic/email-notification-management';

describe('SCEN-040: 有効な報告者が存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象日時点で有効な報告者が0件の場合、NoActiveReportersFoundエラーが発生する', async () => {
    const mockBusinessDay = businessDayModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
    const mockGetActiveReporters = reporterModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
    const mockRetrieveDailyReports = persistenceModule.retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;
    const mockDetectNonSubmitted = detectionModule.detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;
    const mockJudgePromptNecessity = promptDecisionModule.judgePromptNecessityAndMethod as jest.MockedFunction<any>;
    const mockSendLeaderPrompt = notificationModule.sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
    const mockSendNonSubmissionPrompt = emailModule.sendNonSubmissionPromptNotification as jest.MockedFunction<any>;
    const mockRetrieveDashboard = dashboardModule.retrieveLeaderDashboardData as jest.MockedFunction<any>;

    mockBusinessDay.mockResolvedValue({ isBusinessDay: true, deadline: '2024-01-16T17:00:00Z' });

    mockGetActiveReporters.mockResolvedValue([]);

    const fakeAiClient: Tx4Imp1AiClient = {};

    await expect(
      runTx4Imp1Agent(
        { targetDate: '2024-01-15', leaderUserId: 'leader-001', teamId: undefined },
        fakeAiClient,
      ),
    ).rejects.toThrow();

    expect(mockRetrieveDailyReports).not.toHaveBeenCalled();
    expect(mockDetectNonSubmitted).not.toHaveBeenCalled();
    expect(mockJudgePromptNecessity).not.toHaveBeenCalled();
    expect(mockSendLeaderPrompt).not.toHaveBeenCalled();
    expect(mockSendNonSubmissionPrompt).not.toHaveBeenCalled();
    expect(mockRetrieveDashboard).not.toHaveBeenCalled();
  });
});
