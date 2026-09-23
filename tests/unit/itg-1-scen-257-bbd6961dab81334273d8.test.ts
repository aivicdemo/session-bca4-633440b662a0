import { jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-257: detectNonSubmittedReportersAtDeadline - 制約9 提出時刻付きで3名未提出', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出状況の詳細確認：5名中3名が未提出', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    const mockReporters = [
      {
        userId: 'reporter-001',
        userName: '報告者1',
        emailAddress: 'reporter-001@example.com',
        departmentId: '営業部',
      },
      {
        userId: 'reporter-002',
        userName: '報告者2',
        emailAddress: 'reporter-002@example.com',
        departmentId: '営業部',
      },
      {
        userId: 'reporter-003',
        userName: '報告者3',
        emailAddress: 'reporter-003@example.com',
        departmentId: '営業部',
      },
      {
        userId: 'reporter-004',
        userName: '報告者4',
        emailAddress: 'reporter-004@example.com',
        departmentId: '営業部',
      },
      {
        userId: 'reporter-005',
        userName: '報告者5',
        emailAddress: 'reporter-005@example.com',
        departmentId: '営業部',
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
        // reporter-001は2024-01-15T16:30:00Zに提出済み
        // reporter-002は未提出
        // reporter-003は2024-01-15T15:00:00Zに提出済み
        // reporter-004は未提出
        // reporter-005は未提出
        return Promise.resolve(['reporter-001', 'reporter-003'].includes(userId));
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
        nonSubmittedCount: 3,
        submittedCount: 2,
      });

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    };

    const result: DetectNonSubmittedReportersAtDeadlineOutput =
      await detectNonSubmittedReportersAtDeadline(input);

    expect(result.nonSubmittedReporters).toHaveLength(3);
    const nonSubmittedUserIds = result.nonSubmittedReporters.map((r) => r.userId);
    expect(nonSubmittedUserIds).toContain('reporter-002');
    expect(nonSubmittedUserIds).toContain('reporter-004');
    expect(nonSubmittedUserIds).toContain('reporter-005');

    expect(result.nonSubmittedReporters).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-002',
        userName: '報告者2',
        emailAddress: 'reporter-002@example.com',
        departmentId: '営業部',
      }),
    );
    expect(result.nonSubmittedReporters).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-004',
        userName: '報告者4',
        emailAddress: 'reporter-004@example.com',
        departmentId: '営業部',
      }),
    );
    expect(result.nonSubmittedReporters).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-005',
        userName: '報告者5',
        emailAddress: 'reporter-005@example.com',
        departmentId: '営業部',
      }),
    );

    expect(result.detectionLog.detectionDateTime).toBe(currentDateTime);
    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(3);

    expect(result.detectionTimestamp).toBe(currentDateTime);
  });
});
