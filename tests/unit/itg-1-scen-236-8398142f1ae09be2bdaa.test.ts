import { describe, it, expect } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-236: システムの現在日時が取得できない場合は処理を拒否する', () => {
  it('should throw SubmissionStatusCheckFailureError when currentDateTime is null', () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: null as any,
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    } as DetectNonSubmittedReportersAtDeadlineInput;

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(
      SubmissionStatusCheckFailureError
    );
  });

  it('should throw SubmissionStatusCheckFailureError when currentDateTime is undefined', () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: undefined as any,
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    } as DetectNonSubmittedReportersAtDeadlineInput;

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(
      SubmissionStatusCheckFailureError
    );
  });

  it('should throw SubmissionStatusCheckFailureError when currentDateTime is invalid ISO format', () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: 'invalid-date',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(
      SubmissionStatusCheckFailureError
    );
  });
});
