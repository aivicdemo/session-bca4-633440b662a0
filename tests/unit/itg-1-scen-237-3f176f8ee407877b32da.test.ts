import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
  NonSubmissionDetectionLog,
} from '../../src/logic/daily-report-non-submission-detection';
import * as persistence from '../../src/logic/daily-report-persistence';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-237: 登録済み報告者リストから未提出者を正しくフィルタリングして返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly filter non-submitted reporters from registered reporters', async () => {
    const mockJudgeScheduler = jest.spyOn(deadlineJudgment, 'judgeSchedulerExecutionTiming' as any);
    mockJudgeScheduler.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: 'Within deadline',
    });

    const reporters = [
      { userId: 'user1', userName: 'User 1', emailAddress: 'user1@example.com', departmentId: 'dept-1' },
      { userId: 'user2', userName: 'User 2', emailAddress: 'user2@example.com', departmentId: 'dept-1' },
      { userId: 'user3', userName: 'User 3', emailAddress: 'user3@example.com', departmentId: 'dept-1' },
      { userId: 'user4', userName: 'User 4', emailAddress: 'user4@example.com', departmentId: 'dept-1' },
      { userId: 'user5', userName: 'User 5', emailAddress: 'user5@example.com', departmentId: 'dept-1' },
    ];

    const mockGetReporters = jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck' as any);
    mockGetReporters.mockResolvedValue({
      success: true,
      reporters: reporters,
      totalCount: reporters.length,
      message: 'Retrieved active reporters',
    });

    const mockCheckReport = jest.spyOn(persistence, 'checkDailyReportExistsForDate' as any);
    mockCheckReport.mockImplementation(async (input: any) => {
      return ['user1', 'user3', 'user5'].includes(input.userId);
    });

    const mockRetrieveLogs = jest.spyOn(persistence, 'retrieveNonSubmissionDetectionLogsByDate' as any);
    mockRetrieveLogs.mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T17:30:00Z',
    });

    const mockUpdateLog = jest.spyOn(persistence, 'updateNonSubmissionDetectionLogWithReminderStatus' as any);
    mockUpdateLog.mockResolvedValue({
      detectionLogId: 'log-001',
      reminderSent: false,
      updatedAt: '2024-01-15T17:30:00Z',
    });

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result = await detectNonSubmittedReportersAtDeadline(input);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.map((r: any) => r.userId)).toEqual(['user2', 'user4']);
    expect((result.detectionLog as NonSubmissionDetectionLog).targetDate).toBe('2024-01-15');
    expect((result.detectionLog as NonSubmissionDetectionLog).totalReportersCount).toBe(5);
    expect((result.detectionLog as NonSubmissionDetectionLog).nonSubmittedCount).toBe(2);
    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
