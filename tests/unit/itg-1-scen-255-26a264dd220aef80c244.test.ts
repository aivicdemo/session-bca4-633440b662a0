import { jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-255: detectNonSubmittedReportersAtDeadline - 制約7 期限未到達エラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出期限に達する前は DeadlineNotReachedError を送出する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T16:59:00Z'; // 期限17:00の1分前
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    jest
      .spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming')
      .mockResolvedValue(false);

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      DeadlineNotReachedError,
    );

    const error = await detectNonSubmittedReportersAtDeadline(input).catch((e) => e);
    expect(error.message).toBe('日報提出期限に達していないため、未提出者検知を実行できません。');
  });
});
