import { describe, it, expect } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-233: 提出期限時刻が24時間形式でない場合は処理できない', () => {
  it('should reject when submissionDeadlineTime is not in HH:mm format (25:00)', () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '25:00',
      teamId: 'team-001',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow();
  });

  it('should reject when submissionDeadlineTime is in invalid format (abc:00)', () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: 'abc:00',
      teamId: 'team-001',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow();
  });

  it('should reject when submissionDeadlineTime is in invalid format (single digit)', () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17',
      teamId: 'team-001',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow();
  });
});
