import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';

describe('SCEN-239: 提出期限の時刻形式が不正な場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('提出期限の時刻形式が不正な場合、エラーをスローする', async () => {
    const invalidFormats = ['25:00', '17-00', 'abc:00', '', null];

    for (const invalidFormat of invalidFormats) {
      try {
        await detectNonSubmittedReportersAtDeadline({
          targetDate: '2024-01-15',
          currentDateTime: '2024-01-15T17:01:00Z',
          submissionDeadlineTime: invalidFormat as any,
          teamId: 'team-001',
        });
        fail(`Should have thrown an error for format: ${invalidFormat}`);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('提出期限の設定が不正です。管理者に確認してください');
      }
    }
  });
});
