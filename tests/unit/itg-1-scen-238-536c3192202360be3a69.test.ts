import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  NoActiveReportersError,
  DetectNonSubmittedReportersAtDeadlineInput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';

describe('SCEN-238: チームに報告者が登録されていない場合は検知対象がない', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      reporters: [],
    });

    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);
  });

  it('報告者が登録されていない場合、NoActiveReportersErrorが発生する', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(NoActiveReportersError);

    try {
      await detectNonSubmittedReportersAtDeadline(input);
      fail('Should have thrown NoActiveReportersError');
    } catch (error) {
      if (error instanceof NoActiveReportersError) {
        expect(error.message).toBe('検知対象の有効な報告者が存在しません。');
      } else {
        throw error;
      }
    }
  });

  it('エラーの場合、出力フィールドは返されない', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    try {
      await detectNonSubmittedReportersAtDeadline(input);
      fail('Should have thrown an error');
    } catch (error) {
      if (!(error instanceof NoActiveReportersError)) {
        throw error;
      }
      expect(error).toBeDefined();
    }
  });
});
