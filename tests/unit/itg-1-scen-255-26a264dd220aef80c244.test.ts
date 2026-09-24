jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));

import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;

describe('SCEN-255: 業務ルール br-tx_1-005 の制約 7 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('期限1分前（16:59）では DeadlineNotReachedError が送出される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T16:59:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(false);

    let error: any = null;
    try {
      await detectNonSubmittedReportersAtDeadline(input as any);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(DeadlineNotReachedError);
    expect(error.message).toBe('日報提出期限に達していないため、未提出者検知を実行できません。');
  });
});
