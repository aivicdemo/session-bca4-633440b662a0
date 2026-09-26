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

describe('SCEN-017: 提出期限に達していない対象日付で実行した場合', () => {
  const targetDate = '2025-01-15';
  const executionTimestamp = 1673779200000;
  const leaderUserIds = ['leader-001'];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('SubmissionDeadlineNotReachedエラーで拒否される', async () => {
    mockedJudgeSchedulerExecutionTiming.mockRejectedValue(
      new SubmissionDeadlineNotReached('日報提出期限に達していないため、監視を実行できません。')
    );

    const mockAiClient: Tx2Imp1AiClient = {};

    await expect(
      runTx2Imp1Agent(
        { targetDate, executionTimestamp, leaderUserIds },
        mockAiClient
      )
    ).rejects.toThrow(SubmissionDeadlineNotReached);

    expect(mockedJudgeSchedulerExecutionTiming).toHaveBeenCalled();
  });
});
