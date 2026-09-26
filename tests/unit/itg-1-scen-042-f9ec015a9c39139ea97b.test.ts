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

describe('SCEN-042: 未提出者検知処理が失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detectNonSubmittedReportersAtDeadlineがエラーを返すとき、executionStatusはfailureになる', async () => {
    const mockBusinessDay = businessDayModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
    const mockGetActiveReporters = reporterModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
    const mockRetrieveDailyReports = persistenceModule.retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;
    const mockDetectNonSubmitted = detectionModule.detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;

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
    ]);

    mockDetectNonSubmitted.mockRejectedValue(new Error('未提出者検知に失敗しました'));

    const fakeAiClient: Tx4Imp1AiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate: '2024-01-15', leaderUserId: 'leader-001', teamId: 'team-001' },
      fakeAiClient,
    );

    expect(result.executionStatus).toBe('failure');
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    const nonSubmissionError = result.errors?.find((e) => e.code === 'NonSubmissionDetectionFailed');
    expect(nonSubmissionError).toBeDefined();
    expect(nonSubmissionError?.message).toBe('未提出者の検知に失敗しました。');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
