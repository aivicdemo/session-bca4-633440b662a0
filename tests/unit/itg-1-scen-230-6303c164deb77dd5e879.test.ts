import { describe, it, expect } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-230: 提出期限の時刻が設定されていない場合は処理を拒否する', () => {
  it('should reject when submissionDeadlineTime is null', () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: null as any,
      teamId: 'team-001',
    } as DetectNonSubmittedReportersAtDeadlineInput;

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(
      SubmissionStatusCheckFailureError
    );
  });

  it('should reject when submissionDeadlineTime is empty string', () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '',
      teamId: 'team-001',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(
      SubmissionStatusCheckFailureError
    );
  });
});
