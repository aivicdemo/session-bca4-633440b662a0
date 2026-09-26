import { describe, it, expect } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-236: システムの現在日時が取得できない場合は処理を拒否する', () => {
  it('should throw SubmissionStatusCheckFailureError when currentDateTime is null', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: null as any,
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    } as DetectNonSubmittedReportersAtDeadlineInput;

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      SubmissionStatusCheckFailureError
    );
    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      '日報提出状況の確認に失敗しました'
    );
  });

  it('should throw SubmissionStatusCheckFailureError when currentDateTime is undefined', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: undefined as any,
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    } as DetectNonSubmittedReportersAtDeadlineInput;

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      SubmissionStatusCheckFailureError
    );
  });

  it('should throw SubmissionStatusCheckFailureError when currentDateTime is invalid ISO format', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: 'invalid-date',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      SubmissionStatusCheckFailureError
    );
  });

  it('should throw SubmissionStatusCheckFailureError when currentDateTime is empty string', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      SubmissionStatusCheckFailureError
    );
  });
});
