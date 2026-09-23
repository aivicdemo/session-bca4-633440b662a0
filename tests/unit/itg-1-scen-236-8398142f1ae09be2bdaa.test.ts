import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  SubmissionStatusCheckFailureError,
  DetectNonSubmittedReportersAtDeadlineInput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import * as dailyReportPersistenceModule from '../../src/logic/daily-report-persistence';

describe('SCEN-236: システムの現在日時が取得できない場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('currentDateTimeがnullの場合、SubmissionStatusCheckFailureErrorが発生する', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: null as any,
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      SubmissionStatusCheckFailureError,
    );

    try {
      await detectNonSubmittedReportersAtDeadline(input);
      fail('Should have thrown SubmissionStatusCheckFailureError');
    } catch (error) {
      if (error instanceof SubmissionStatusCheckFailureError) {
        expect(error.message).toBe('日報提出状況の確認に失敗しました。');
      } else {
        throw error;
      }
    }
  });

  it('currentDateTimeが無効な値の場合、SubmissionStatusCheckFailureErrorが発生する', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: 'invalid-date-format',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      SubmissionStatusCheckFailureError,
    );
  });
});
