import { jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-258: detectNonSubmittedReportersAtDeadline - 制約10 A,B,Cは提出済み、D,Eは未提出', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('業務ルール br-tx_1-005 の制約10が設計どおりに動作する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    const mockReporters = [
      {
        userId: 'reporterA',
        userName: '報告者A',
        emailAddress: 'reporterA@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporterB',
        userName: '報告者B',
        emailAddress: 'reporterB@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporterC',
        userName: '報告者C',
        emailAddress: 'reporterC@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporterD',
        userName: '報告者D',
        emailAddress: 'reporterD@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporterE',
        userName: '報告者E',
        emailAddress: 'reporterE@example.com',
        departmentId: 'dept-001',
      },
    ];

    jest
      .spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming')
      .mockResolvedValue(true);

    jest
      .spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck')
      .mockResolvedValue(mockReporters);

    jest
      .spyOn(dailyReportPersistence, 'checkDailyReportExistsForDate')
      .mockImplementation((userId: string) => {
        // A, B, Cは提出済み、D, Eは未提出
        return Promise.resolve(['reporterA', 'reporterB', 'reporterC'].includes(userId));
      });

    jest
      .spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate')
      .mockResolvedValue([]);

    jest
      .spyOn(dailyReportPersistence, 'updateNonSubmissionDetectionLogWithReminderStatus')
      .mockResolvedValue({
        detectionLogId: 'log-001',
        targetDate,
        detectionDateTime: currentDateTime,
        totalReportersCount: 5,
        nonSubmittedCount: 2,
        submittedCount: 3,
      });

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    };

    const result: DetectNonSubmittedReportersAtDeadlineOutput =
      await detectNonSubmittedReportersAtDeadline(input);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    const nonSubmittedUserIds = result.nonSubmittedReporters.map((r) => r.userId);
    expect(nonSubmittedUserIds).toContain('reporterD');
    expect(nonSubmittedUserIds).toContain('reporterE');

    expect(result.nonSubmittedReporters).toContainEqual(
      expect.objectContaining({
        userId: 'reporterD',
        userName: '報告者D',
        emailAddress: 'reporterD@example.com',
      }),
    );
    expect(result.nonSubmittedReporters).toContainEqual(
      expect.objectContaining({
        userId: 'reporterE',
        userName: '報告者E',
        emailAddress: 'reporterE@example.com',
      }),
    );

    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe(currentDateTime);
  });
});
