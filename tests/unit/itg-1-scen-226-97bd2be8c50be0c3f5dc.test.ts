import {
  detectNonSubmittedReportersAtDeadline,
  NoActiveReportersError,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import {
  getActiveReportersForSubmissionCheck,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

describe('SCEN-226: 検知対象に有効な報告者が存在しない場合は処理を中断する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な報告者が0名の場合、NoActiveReportersErrorをスローする', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    // judgeSchedulerExecutionTiming: 提出期限に達したことを返す
    (judgeSchedulerExecutionTiming as jest.Mock).mockReturnValue(true);

    // getActiveReportersForSubmissionCheck: 0名を返す
    (getActiveReportersForSubmissionCheck as jest.Mock).mockReturnValue([]);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      })
    ).rejects.toThrow(NoActiveReportersError);

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      });
    } catch (error) {
      if (error instanceof NoActiveReportersError) {
        expect(error.message).toBe('検知対象の有効な報告者が存在しません。');
      }
    }
  });
});
