import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';

describe('SCEN-243: 提出期限に達していない場合の検知をスキップする', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('現在時刻が提出期限に達していない場合、DeadlineNotReachedErrorをスローする', async () => {
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(false);

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T16:30:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      });
      fail('Should have thrown DeadlineNotReachedError');
    } catch (error) {
      expect(error).toBeInstanceOf(DeadlineNotReachedError);
      expect((error as Error).message).toBe('日報提出期限に達していないため、未提出者検知を実行できません。');
    }
  });
});
