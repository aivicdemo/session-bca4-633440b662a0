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
import type { RetrieveNonSubmissionDetectionLogsByDateOutput, UpdateNonSubmissionDetectionLogWithReminderStatusOutput } from '../../src/logic/daily-report-persistence';

describe('SCEN-241: 報告者ごとの提出状況を提出時刻付きで正しく識別して返す', () => {
  const targetDate = '2024-01-15';
  const currentDateTime = '2024-01-15T17:30:00Z';
  const submissionDeadlineTime = '17:00';
  const teamId = 'team-001';

  const activeReporters = [
    { reporterId: 'R001', userId: 'reporter-001', reporterName: '太郎', emailAddress: 'taro@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R002', userId: 'reporter-002', reporterName: '花子', emailAddress: 'hanako@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R003', userId: 'reporter-003', reporterName: '次郎', emailAddress: 'jiro@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R004', userId: 'reporter-004', reporterName: '美咲', emailAddress: 'misaki@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R005', userId: 'reporter-005', reporterName: '健太', emailAddress: 'kenta@example.com', department: '営業部', status: 'active' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should identify non-submitted reporters and return detection log with correct details', async () => {
    const timerOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '業務終了時刻に達しています',
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
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const logsOutput: RetrieveNonSubmissionDetectionLogsByDateOutput = {
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: currentDateTime,
    };
    jest.spyOn(dailyReportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue(logsOutput);

    const updateOutput: UpdateNonSubmissionDetectionLogWithReminderStatusOutput = {
      detectionLogId: 'log-123',
      reminderSent: true,
      reminderSentDateTime: currentDateTime,
      updatedAt: currentDateTime,
    };
    jest.spyOn(dailyReportPersistenceModule, 'updateNonSubmissionDetectionLogWithReminderStatus').mockResolvedValue(updateOutput);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'reporter-003',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'reporter-005',
    });

    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
