import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../../src/logic/business-day-deadline-judgment');
jest.mock('../../../src/logic/reporter-master-management');
jest.mock('../../../src/logic/daily-report-persistence');

describe('SCEN-225: 提出期限に達していない時刻での実行を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出期限17:00より前の時刻16:59での実行で、DeadlineNotReachedErrorをスローする', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T16:59:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    // judgeSchedulerExecutionTiming: 期限に未到達を返す
    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue(false);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      })
    ).rejects.toThrow(DeadlineNotReachedError);

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      });
    } catch (error) {
      if (error instanceof DeadlineNotReachedError) {
        expect(error.message).toBe(
          '日報提出期限に達していないため、未提出者検知を実行できません。'
        );
      }
    }
  });
});
