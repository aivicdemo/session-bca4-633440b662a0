import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as detectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecisionModule from '../../src/logic/non-submission-prompt-decision';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';
import * as emailModule from '../../src/logic/email-notification-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as dashboardModule from '../../src/logic/daily-report-management-view';

describe('SCEN-030: 報告者マスタが古い状態で実行される', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  const nonSubmittedReporters = Array(6).fill(null).map((_, i) => ({
    userId: `u00${i}`,
    userName: `社員${i}`,
    emailAddress: `u00${i}@example.com`,
    reporterName: `社員${i}`,
    department: '営業部',
    promptPriority: 'high',
  }));

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(businessDayModule.judgeSchedulerExecutionTiming).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '定時実行タイミング',
    } as any);

    jest.mocked(detectionModule.detectNonSubmittedReportersAtDeadline).mockResolvedValue(<any>{
      nonSubmittedReporters,
      detectionLog: { detectionLogId: 'det-log', targetDate, totalReportersCount: 6, nonSubmittedCount: 6 },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    } as any);

    jest.mocked(detectionModule.generateNonSubmissionDetectionResult).mockResolvedValue({} as any);
    jest.mocked(promptDecisionModule.judgePromptNecessityAndMethod).mockResolvedValue({} as any);
    jest.mocked(notificationModule.sendLeaderNonSubmissionPromptNotification).mockResolvedValue({} as any);
    jest.mocked(emailModule.sendNonSubmissionPromptNotification).mockResolvedValue({} as any);
    jest.mocked(persistenceModule.retrieveDailyReportsForLeaderReview).mockResolvedValue({} as any);
    jest.mocked(dashboardModule.retrieveLeaderDashboardData).mockResolvedValue({} as any);
  });

  it('6人が未提出検知される（退職者を含む）', async () => {
    const input = { targetDate, executionTimestamp, leaderUserIds };
    const output = await runTx3Imp1Agent(input, {} as Tx3Imp1AiClient);

    expect(output.executionStatus).toBe('partial_failure');
    expect(Array.isArray(output.promptNotificationStatus)).toBe(true);
    expect(output.promptNotificationStatus.length).toBe(6);
  });
});
