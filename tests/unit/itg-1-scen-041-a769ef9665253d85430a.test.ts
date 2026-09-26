import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

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

describe('SCEN-041: 日報の自動解析に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieveDailyReportsForLeaderReviewがエラーを返すとき、executionStatusはfailureになる', async () => {
    const mockBusinessDay = businessDayModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
    const mockGetActiveReporters = reporterModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
    const mockRetrieveDailyReports = persistenceModule.retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;

    mockBusinessDay.mockResolvedValue({ isBusinessDay: true, deadline: '2024-01-16T17:00:00Z' });

    mockGetActiveReporters.mockResolvedValue([
      { userId: 'reporter-001', userName: 'user-001', reporterName: '報告者1' },
    ]);

    mockRetrieveDailyReports.mockRejectedValue(new Error('解析失敗'));

    const fakeAiClient: Tx4Imp1AiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate: '2024-01-15', leaderUserId: 'leader-001', teamId: 'team-001' },
      fakeAiClient,
    );

    expect(result.executionStatus).toBe('failure');
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].code).toBe('DailyReportAnalysisFailed');
    expect(result.errors?.[0].message).toBe('日報の自動解析処理に失敗しました。');
  });
});
