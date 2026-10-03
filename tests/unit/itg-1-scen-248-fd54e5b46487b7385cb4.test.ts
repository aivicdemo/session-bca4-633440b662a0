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

describe('SCEN-248: 検知実行日時、対象日付、検知対象者数、未提出者数を記録した検知ログを生成する', () => {
  const targetDate = '2024-01-15';
  const currentDateTime = '2024-01-15T17:30:00Z';
  const submissionDeadlineTime = '17:00';
  const teamId = 'TEAM-001';

  const activeReporters = [
    { reporterId: 'R001', userId: 'user-001', reporterName: 'User 1', emailAddress: 'user1@example.com', department: 'Department 1', status: 'active' },
    { reporterId: 'R002', userId: 'user-002', reporterName: 'User 2', emailAddress: 'user2@example.com', department: 'Department 2', status: 'active' },
    { reporterId: 'R003', userId: 'user-003', reporterName: 'User 3', emailAddress: 'user3@example.com', department: 'Department 3', status: 'active' },
    { reporterId: 'R004', userId: 'user-004', reporterName: 'User 4', emailAddress: 'user4@example.com', department: 'Department 4', status: 'active' },
    { reporterId: 'R005', userId: 'user-005', reporterName: 'User 5', emailAddress: 'user5@example.com', department: 'Department 5', status: 'active' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should generate detection log with correct timestamp, target date, total count, and non-submitted count', async () => {
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
      detectionLogId: 'log-789',
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

    expect(result.detectionLog).toBeDefined();
    expect(result.detectionLog.detectionDateTime).toBe(currentDateTime);
    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.every((r) => r.userId && r.userName && r.emailAddress && r.department)).toBe(true);

    expect(result.detectionTimestamp).toBe(currentDateTime);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.detectionTimestamp)).toBe(true);
  });
});
