jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeSchedulerExecutionTiming: jest.fn(),
}));

import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;

describe('SCEN-255: 業務ルール br-tx_1-005 の制約 7 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('現在時刻が期限前（16:59）では DeadlineNotReachedError が送出される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T16:59:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    (mockedJudgeSchedulerExecutionTiming as jest.Mock<any>).mockResolvedValue(false);

    try {
      await detectNonSubmittedReportersAtDeadline(input);
      fail('DeadlineNotReachedError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DeadlineNotReachedError);
      expect((error as Error).message).toBe('日報提出期限に達していないため、未提出者検知を実行できません。');
    }
  });
});
