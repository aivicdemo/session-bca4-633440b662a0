import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineOutput,
  NonSubmissionDetectionLog,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-241: 報告者ごとの提出状況を提出時刻付きで正しく識別して返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('未提出者を正しく識別し、提出時刻なしで返す', async () => {
    const mockReporters = [
      { userId: 'reporter-001', name: '太郎', email: 'taro@example.com', department: '営業部' },
      { userId: 'reporter-002', name: '花子', email: 'hanako@example.com', department: '営業部' },
      { userId: 'reporter-003', name: '次郎', email: 'jiro@example.com', department: '営業部' },
      { userId: 'reporter-004', name: '美咲', email: 'misaki@example.com', department: '営業部' },
      { userId: 'reporter-005', name: '健太', email: 'kenta@example.com', department: '営業部' },
    ];

    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck').mockResolvedValue(mockReporters);

    jest.spyOn(dailyReportPersistence, 'checkDailyReportExistsForDate').mockImplementation((userId: string) => {
      const submissionMap: Record<string, any> = {
        'reporter-001': { submissionTime: '2024-01-15T16:45:00Z' },
        'reporter-002': { submissionTime: '2024-01-15T17:15:00Z' },
        'reporter-003': null,
        'reporter-004': { submissionTime: '2024-01-15T16:30:00Z' },
        'reporter-005': null,
      };
      return Promise.resolve(submissionMap[userId]);
    });

    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([]);
    jest.spyOn(dailyReportPersistence, 'updateNonSubmissionDetectionLogWithReminderStatus').mockResolvedValue({
      id: 'log-1',
      detectionDateTime: '2024-01-15T17:30:00Z',
      targetDate: '2024-01-15',
      detectionTargetCount: 5,
      nonSubmittedCount: 2,
    });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    });

    expect(result).toBeDefined();
    expect(result.nonSubmittedReporters).toHaveLength(2);

    const nonSubmittedIds = result.nonSubmittedReporters.map((r: any) => r.userId);
    expect(nonSubmittedIds).toContain('reporter-003');
    expect(nonSubmittedIds).toContain('reporter-005');

    const reporter003 = result.nonSubmittedReporters.find((r: any) => r.userId === 'reporter-003');
    expect(reporter003).toEqual({
      userId: 'reporter-003',
      name: '次郎',
      email: 'jiro@example.com',
      department: '営業部',
    });

    const reporter005 = result.nonSubmittedReporters.find((r: any) => r.userId === 'reporter-005');
    expect(reporter005).toEqual({
      userId: 'reporter-005',
      name: '健太',
      email: 'kenta@example.com',
      department: '営業部',
    });

    expect(result.detectionLog).toBeDefined();
    expect(result.detectionLog.detectionTargetCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
