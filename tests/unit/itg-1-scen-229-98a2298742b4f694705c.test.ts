import { describe, it, expect, jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-229: 報告者IDが空または不正な形式の場合は処理を拒否する', () => {
  it('should reject input with empty reporter IDs', () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-A',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow();
  });
});
