import { describe, it, expect } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-239: 提出期限の時刻形式が不正な場合は処理を拒否する', () => {
  const invalidFormats = ['25:00', '17-00', 'abc:00', '', null];

  invalidFormats.forEach((format) => {
    it(`should reject invalid deadline time format: ${JSON.stringify(format)}`, () => {
      const input = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:01:00Z',
        submissionDeadlineTime: format,
        teamId: 'team-001',
      } as any as DetectNonSubmittedReportersAtDeadlineInput;

      expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow();
    });
  });
});
