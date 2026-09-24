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

describe('SCEN-232: 複数の報告者が存在する場合に提出済みと未提出を正しく区別する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly distinguish between submitted and non-submitted reporters', () => {
    const mockJudgeScheduler = jest.spyOn(deadlineJudgment, 'judgeSchedulerExecutionTiming' as any);
    mockJudgeScheduler.mockReturnValue(true);

    const mockGetReporters = jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck' as any);
    mockGetReporters.mockReturnValue([
      { userId: 'reporter-001', userName: 'Reporter 001', emailAddress: 'reporter001@example.com', departmentId: 'dept-1' },
      { userId: 'reporter-002', userName: 'Reporter 002', emailAddress: 'reporter002@example.com', departmentId: 'dept-1' },
      { userId: 'reporter-003', userName: 'Reporter 003', emailAddress: 'reporter003@example.com', departmentId: 'dept-1' },
      { userId: 'reporter-004', userName: 'Reporter 004', emailAddress: 'reporter004@example.com', departmentId: 'dept-1' },
      { userId: 'reporter-005', userName: 'Reporter 005', emailAddress: 'reporter005@example.com', departmentId: 'dept-1' },
    ]);

    const mockCheckReport = jest.spyOn(persistence, 'checkDailyReportExistsForDate' as any);
    mockCheckReport.mockImplementation(async (reporterId: string) => {
      return ['reporter-001', 'reporter-003', 'reporter-005'].includes(reporterId);
    });

    const mockRetrieveLogs = jest.spyOn(persistence, 'retrieveNonSubmissionDetectionLogsByDate' as any);
    mockRetrieveLogs.mockReturnValue([]);

    const mockUpdateLog = jest.spyOn(persistence, 'updateNonSubmissionDetectionLogWithReminderStatus' as any);
    mockUpdateLog.mockReturnValue({ detectionLogId: 'log-001' });

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:05:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result = detectNonSubmittedReportersAtDeadline(input) as DetectNonSubmittedReportersAtDeadlineOutput;

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.map((r: any) => r.userId)).toEqual(['reporter-002', 'reporter-004']);
    expect((result.detectionLog as NonSubmissionDetectionLog).totalReportersCount).toBe(5);
    expect((result.detectionLog as NonSubmissionDetectionLog).nonSubmittedCount).toBe(2);
    expect(result.detectionTimestamp).toBe('2024-01-15T17:05:00Z');
  });
});
