import { jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-256: detectNonSubmittedReportersAtDeadline - 制約8 5名中2名が未提出', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期限到達時刻に5名中2名が未提出の場合、正確に2名の情報を返す', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    const mockReporters = [
      {
        userId: 'reporter-001',
        userName: '報告者1',
        emailAddress: 'reporter-001@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-002',
        userName: '報告者2',
        emailAddress: 'reporter-002@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-003',
        userName: '報告者3',
        emailAddress: 'reporter-003@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-004',
        userName: '報告者4',
        emailAddress: 'reporter-004@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-005',
        userName: '報告者5',
        emailAddress: 'reporter-005@example.com',
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
        // reporter-001, 002, 003が提出済み、004, 005が未提出
        return Promise.resolve(['reporter-001', 'reporter-002', 'reporter-003'].includes(userId));
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
    expect(result.nonSubmittedReporters[0].userId).toBe('reporter-004');
    expect(result.nonSubmittedReporters[0].userName).toBe('報告者4');
    expect(result.nonSubmittedReporters[0].emailAddress).toBe('reporter-004@example.com');
    expect(result.nonSubmittedReporters[1].userId).toBe('reporter-005');
    expect(result.nonSubmittedReporters[1].userName).toBe('報告者5');
    expect(result.nonSubmittedReporters[1].emailAddress).toBe('reporter-005@example.com');

    expect(result.detectionLog.detectionDateTime).toBe(currentDateTime);
    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe(currentDateTime);
  });
});
