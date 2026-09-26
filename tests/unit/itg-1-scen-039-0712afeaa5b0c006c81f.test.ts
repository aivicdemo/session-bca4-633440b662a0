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

describe('SCEN-039: 対象日が営業日でない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定対象日が営業日でない場合、TargetDateNotBusinessDayエラーが発生する', async () => {
    const mockBusinessDay = businessDayModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
    const mockGetActiveReporters = reporterModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
    const mockRetrieveDailyReports = persistenceModule.retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;
    const mockDetectNonSubmitted = detectionModule.detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;
    const mockSendLeaderPrompt = notificationModule.sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
    const mockSendNonSubmissionPrompt = emailModule.sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

    mockBusinessDay.mockResolvedValue({ isBusinessDay: false });

    const fakeAiClient: Tx4Imp1AiClient = {};

    await expect(
      runTx4Imp1Agent(
        { targetDate: '2025-01-11', leaderUserId: 'leader-001', teamId: 'team-001' },
        fakeAiClient,
      ),
    ).rejects.toThrow();

    expect(mockGetActiveReporters).not.toHaveBeenCalled();
    expect(mockRetrieveDailyReports).not.toHaveBeenCalled();
    expect(mockDetectNonSubmitted).not.toHaveBeenCalled();
    expect(mockSendLeaderPrompt).not.toHaveBeenCalled();
    expect(mockSendNonSubmissionPrompt).not.toHaveBeenCalled();
  });
});
