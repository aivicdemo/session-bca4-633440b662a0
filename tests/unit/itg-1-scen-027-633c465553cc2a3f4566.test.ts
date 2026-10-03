import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, SchedulerExecutionTimingError, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-027: SchedulerExecutionTimingError が発生する', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader001'];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(businessDayModule.judgeSchedulerExecutionTiming).mockRejectedValue(
      new SchedulerExecutionTimingError('定時スケジューラの実行タイミング判定に失敗しました。')
    );
  });

  it('SchedulerExecutionTimingError がスロー', async () => {
    const input = { targetDate, executionTimestamp, leaderUserIds };
    await expect(runTx3Imp1Agent(input, {} as Tx3Imp1AiClient)).rejects.toThrow(SchedulerExecutionTimingError);
    await expect(runTx3Imp1Agent(input, {} as Tx3Imp1AiClient)).rejects.toThrow('定時スケジューラの実行タイミング判定に失敗しました。');
  });
});
