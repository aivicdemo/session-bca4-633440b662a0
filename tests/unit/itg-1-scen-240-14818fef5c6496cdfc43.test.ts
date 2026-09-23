import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-240: 現在時刻が提出期限より前の場合は検知をスキップする', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('現在時刻が提出期限に達していない場合、DeadlineNotReachedErrorをスローする', async () => {
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(false);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck').mockResolvedValue([
      { userId: 'r1', name: '報告者1', email: 'r1@example.com', department: '部門1' },
      { userId: 'r2', name: '報告者2', email: 'r2@example.com', department: '部門1' },
      { userId: 'r3', name: '報告者3', email: 'r3@example.com', department: '部門1' },
      { userId: 'r4', name: '報告者4', email: 'r4@example.com', department: '部門1' },
      { userId: 'r5', name: '報告者5', email: 'r5@example.com', department: '部門1' },
    ]);

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
