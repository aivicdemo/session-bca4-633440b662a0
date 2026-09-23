import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import * as dailyReportPersistenceModule from '../../src/logic/daily-report-persistence';

describe('SCEN-237: 登録済み報告者リストから未提出者を正しくフィルタリングして返す', () => {
  const mockReporters = [
    { userId: 'user-001', userName: 'Alice', emailAddress: 'alice@example.com', departmentId: 'dept-001' },
    { userId: 'user-002', userName: 'Bob', emailAddress: 'bob@example.com', departmentId: 'dept-001' },
    { userId: 'user-003', userName: 'Charlie', emailAddress: 'charlie@example.com', departmentId: 'dept-001' },
    { userId: 'user-004', userName: 'David', emailAddress: 'david@example.com', departmentId: 'dept-001' },
    { userId: 'user-005', userName: 'Eve', emailAddress: 'eve@example.com', departmentId: 'dept-001' },
  ];

  const submittedReporterIds = new Set(['user-001', 'user-002', 'user-003']); // 3名が提出済み

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      reporters: mockReporters,
    });

    jest.spyOn(dailyReportPersistenceModule, 'checkDailyReportExistsForDate').mockResolvedValue({
      submittedReporterIds,
    });

    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);

    jest.spyOn(dailyReportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([]);

    jest.spyOn(dailyReportPersistenceModule, 'updateNonSubmissionDetectionLogWithReminderStatus').mockResolvedValue({
      logId: 'log-001',
    });
  });

  it('登録済み5名中、提出していない2名を正確にフィルタリングして返す', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result: DetectNonSubmittedReportersAtDeadlineOutput = await detectNonSubmittedReportersAtDeadline(input);

    expect(result.nonSubmittedReporters).toHaveLength(2);

    const nonSubmittedIds = result.nonSubmittedReporters.map((r: any) => r.userId);
    expect(nonSubmittedIds).toContain('user-004');
    expect(nonSubmittedIds).toContain('user-005');

    expect(result.nonSubmittedReporters[0]).toHaveProperty('userId');
    expect(result.nonSubmittedReporters[0]).toHaveProperty('userName');
    expect(result.nonSubmittedReporters[0]).toHaveProperty('emailAddress');
    expect(result.nonSubmittedReporters[0]).toHaveProperty('departmentId');
  });

  it('detectionLogフィールドに正しい統計情報を記録する', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result: DetectNonSubmittedReportersAtDeadlineOutput = await detectNonSubmittedReportersAtDeadline(input);

    expect(result.detectionLog).toHaveProperty('targetDate', '2024-01-15');
    expect(result.detectionLog).toHaveProperty('detectionDateTime', '2024-01-15T17:30:00Z');
    expect(result.detectionLog).toHaveProperty('totalReportersCount', 5);
    expect(result.detectionLog).toHaveProperty('nonSubmittedCount', 2);
  });

  it('detectionTimestampフィールドがcurrentDateTimeと一致するISO 8601形式であることを検証する', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result: DetectNonSubmittedReportersAtDeadlineOutput = await detectNonSubmittedReportersAtDeadline(input);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
    expect(result.detectionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
