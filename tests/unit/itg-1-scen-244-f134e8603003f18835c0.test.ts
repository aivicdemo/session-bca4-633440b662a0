import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineOutput,
  NonSubmissionDetectionLog,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-244: 未提出者一覧と通知送信完了フラグを正しく返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('未提出者一覧と検知ログ、タイムスタンプを正しく返す', async () => {
    const mockReporters = [
      { userId: 'user-001', name: 'ユーザー1', email: 'user001@example.com', department: '部門A' },
      { userId: 'user-002', name: 'ユーザー2', email: 'user002@example.com', department: '部門A' },
      { userId: 'user-003', name: 'ユーザー3', email: 'user003@example.com', department: '部門A' },
      { userId: 'user-004', name: 'ユーザー4', email: 'user004@example.com', department: '部門A' },
      { userId: 'user-005', name: 'ユーザー5', email: 'user005@example.com', department: '部門A' },
    ];

    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck').mockResolvedValue(mockReporters);

    jest.spyOn(dailyReportPersistence, 'checkDailyReportExistsForDate').mockImplementation((userId: string) => {
      const submissionMap: Record<string, any> = {
        'user-001': { submissionTime: '2024-01-15T16:30:00Z' },
        'user-002': { submissionTime: '2024-01-15T16:45:00Z' },
        'user-003': { submissionTime: '2024-01-15T17:00:00Z' },
        'user-004': null,
        'user-005': null,
      };
      return Promise.resolve(submissionMap[userId]);
    });

    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([]);

    const mockUpdatedLog = {
      id: 'log-1',
      detectionDateTime: '2024-01-15T17:00:00Z',
      targetDate: '2024-01-15',
      detectionTargetCount: 5,
      nonSubmittedCount: 2,
    };

    jest.spyOn(dailyReportPersistence, 'updateNonSubmissionDetectionLogWithReminderStatus').mockResolvedValue(mockUpdatedLog);

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    });

    expect(result).toBeDefined();
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(result.nonSubmittedReporters).toHaveLength(2);

    const nonSubmittedIds = result.nonSubmittedReporters.map((r: any) => r.userId).sort();
    expect(nonSubmittedIds).toEqual(['user-004', 'user-005']);

    expect(result.detectionLog).toBeDefined();
    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:00:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.detectionTargetCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');

    expect(dailyReportPersistence.updateNonSubmissionDetectionLogWithReminderStatus).toHaveBeenCalledTimes(1);
  });
});
