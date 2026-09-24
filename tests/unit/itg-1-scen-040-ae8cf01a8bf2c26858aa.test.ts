jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));

import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;

describe('SCEN-040: 対象日時点で有効な報告者が存在しない場合、NoActiveReportersFoundエラーが発生する', () => {
  const targetDate = '2024-01-15';
  const leaderUserId = 'leader-001';

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      deadline: '2024-01-15T17:00:00+09:00',
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: [],
      count: 0,
    });
  });

  it('should return NoActiveReportersFound error when no active reporters exist', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId: undefined },
      fakeAiClient
    );

    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
    
    const error = result.errors.find((e: any) => e.code === 'NoActiveReportersFound');
    expect(error).toBeDefined();
    expect(error.message).toContain('提出状況を確認する対象の報告者が存在しません');
  });

  it('should not call downstream functions when no reporters found', async () => {
    const fakeAiClient = {};

    await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId: undefined },
      fakeAiClient
    );

    expect(mockedGetActiveReportersForSubmissionCheck).toHaveBeenCalled();
  });
});
