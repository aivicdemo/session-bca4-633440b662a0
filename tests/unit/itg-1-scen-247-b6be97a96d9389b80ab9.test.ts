import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reporter-master-management')>('../../src/logic/reporter-master-management'),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
}));

import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import * as dailyReportPersistenceModule from '../../src/logic/daily-report-persistence';
import type { JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';
import type { GetActiveReportersForSubmissionCheckOutput } from '../../src/logic/reporter-master-management';

describe('SCEN-247: リーダーのメールアドレスが登録されていない場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should reject when leader email address is not registered', async () => {
    const activeReporters = [
      { reporterId: 'R001', userId: 'reporter-001', reporterName: 'Reporter 1', emailAddress: '', department: 'Sales', status: 'active' },
      { reporterId: 'R002', userId: 'reporter-002', reporterName: 'Reporter 2', emailAddress: '', department: 'Sales', status: 'active' },
      { reporterId: 'R003', userId: 'reporter-003', reporterName: 'Reporter 3', emailAddress: 'reporter3@example.com', department: 'Sales', status: 'active' },
      { reporterId: 'R004', userId: 'reporter-004', reporterName: 'Reporter 4', emailAddress: 'reporter4@example.com', department: 'Sales', status: 'active' },
      { reporterId: 'R005', userId: 'reporter-005', reporterName: 'Reporter 5', emailAddress: 'reporter5@example.com', department: 'Sales', status: 'active' },
    ];

    const timerOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '実行タイミング内',
    };
    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue(timerOutput);

    const reporterOutput: GetActiveReportersForSubmissionCheckOutput = {
      success: true,
      reporters: activeReporters,
      totalCount: 5,
      message: '対象報告者を取得しました',
    };
    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue(reporterOutput);

    jest
      .spyOn(dailyReportPersistenceModule, 'checkDailyReportExistsForDate')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:30:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      })
    ).rejects.toThrow(/リーダーのメールアドレスを設定してください|メール/);
  });
});
