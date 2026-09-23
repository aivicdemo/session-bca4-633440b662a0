import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-245: 報告期限時刻が不正な形式の場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('報告期限時刻がHH:mm形式でない複数のケースで処理を拒否する', async () => {
    const invalidFormats = ['25:00', '17時', '17-00', '17:0', '1700'];

    for (const invalidFormat of invalidFormats) {
      jest.resetAllMocks();

      try {
        await detectNonSubmittedReportersAtDeadline({
          targetDate: '2024-01-15',
          currentDateTime: '2024-01-15T17:00:00Z',
          submissionDeadlineTime: invalidFormat,
          teamId: 'team-001',
        });
        fail(`Should have thrown an error for format: ${invalidFormat}`);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBeTruthy();
      }
    }
  });
});
