import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));

import { runTx2Imp1Agent, type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;

class SubmissionDeadlineNotReached extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionDeadlineNotReached';
  }
}

describe('SCEN-018: 対象日付にアクティブな報告者が存在しない場合', () => {
  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001'];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '定時実行タイミング内',
    });
  });

  it('SubmissionDeadlineNotReachedエラーを発生させる', async () => {
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: false,
      isBusinessDay: true,
      isWithinExecutionWindow: false,
      nextScheduledExecutionTime: null,
      executionReason: '提出期限に達していない',
    });

    const mockAiClient: Tx2Imp1AiClient = {};

    await expect(
      runTx2Imp1Agent(
        { targetDate, executionTimestamp, leaderUserIds },
        mockAiClient
      )
    ).rejects.toThrow(SubmissionDeadlineNotReached);
  });
});
