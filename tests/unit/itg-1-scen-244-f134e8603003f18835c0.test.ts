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

describe('SCEN-244: 未提出者一覧と通知送信完了フラグを正しく返す', () => {
  const targetDate = '2024-01-15';
  const currentDateTime = '2024-01-15T17:00:00Z';
  const submissionDeadlineTime = '17:00';
  const teamId = 'team-001';

  const activeReporters = [
    { reporterId: 'R001', userId: 'user-001', reporterName: 'Reporter 1', emailAddress: 'user001@example.com', department: 'Sales', status: 'active' },
    { reporterId: 'R002', userId: 'user-002', reporterName: 'Reporter 2', emailAddress: 'user002@example.com', department: 'Sales', status: 'active' },
    { reporterId: 'R003', userId: 'user-003', reporterName: 'Reporter 3', emailAddress: 'user003@example.com', department: 'Sales', status: 'active' },
    { reporterId: 'R004', userId: 'user-004', reporterName: 'Reporter 4', emailAddress: 'user004@example.com', department: 'Sales', status: 'active' },
    { reporterId: 'R005', userId: 'user-005', reporterName: 'Reporter 5', emailAddress: 'user005@example.com', department: 'Sales', status: 'active' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return non-submitted reporters and detection log with correct values', async () => {
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
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    const logsOutput: RetrieveNonSubmissionDetectionLogsByDateOutput = {
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: currentDateTime,
    };
    jest.spyOn(dailyReportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue(logsOutput);

    const updateOutput: UpdateNonSubmissionDetectionLogWithReminderStatusOutput = {
      detectionLogId: 'log-456',
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
    expect(result.nonSubmittedReporters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'user-004' }),
        expect.objectContaining({ userId: 'user-005' }),
      ])
    );

    expect(result.detectionLog).toBeDefined();
    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
