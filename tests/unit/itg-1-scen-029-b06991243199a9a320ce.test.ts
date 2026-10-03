import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, LeaderNotificationFailure, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as detectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecisionModule from '../../src/logic/non-submission-prompt-decision';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-029: LeaderNotificationFailure が発生する', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(businessDayModule.judgeSchedulerExecutionTiming).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '定時実行タイミング',
    } as any);

    jest.mocked(detectionModule.detectNonSubmittedReportersAtDeadline).mockResolvedValue({
      nonSubmittedReporters: [{ userId: 'u001', emailAddress: 'u001@example.com' }],
      detectionLog: { detectionLogId: 'det-log' },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    } as any);

    (jest.mocked(detectionModule.generateNonSubmissionDetectionResult) as any).mockResolvedValue({});
    jest.mocked(promptDecisionModule.judgePromptNecessityAndMethod).mockResolvedValue({} as any);

    jest.mocked(notificationModule.sendLeaderNonSubmissionPromptNotification).mockRejectedValue(
      new LeaderNotificationFailure('リーダーへの通知送信に失敗しました。')
    );
  });

  it('LeaderNotificationFailure がスロー', async () => {
    const input = { targetDate, executionTimestamp, leaderUserIds };
    await expect(runTx3Imp1Agent(input, {} as Tx3Imp1AiClient)).rejects.toThrow(LeaderNotificationFailure);
  });
});
