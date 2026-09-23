import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-242: 報告期限時刻の形式が不正な場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('submissionDeadlineTimeがHH:mm形式でない場合、エラーをスローする', async () => {
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T16:59:00Z',
        submissionDeadlineTime: 'invalid-format',
        teamId: 'team-001',
      });
      fail('Should have thrown an error for invalid format');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('報告期限時刻の形式が正しくありません');
    }
  });
});
