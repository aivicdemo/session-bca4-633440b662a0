jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

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

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(false);

    await expect(
      detectNonSubmittedReportersAtDeadline(input as any)
    ).rejects.toThrow(DeadlineNotReachedError);

    await expect(
      detectNonSubmittedReportersAtDeadline(input as any)
    ).rejects.toThrow('日報提出期限に達していないため、未提出者検知を実行できません。');
  });
});
