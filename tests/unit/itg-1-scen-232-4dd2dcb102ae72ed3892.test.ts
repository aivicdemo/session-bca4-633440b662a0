import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-232: 複数の報告者が存在する場合に提出済みと未提出を正しく区別する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('5名の報告者のうち2名が未提出の場合、正しく区別して出力する', async () => {
    // judgeSchedulerExecutionTiming をスタブ化（期限に達している）
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);

    // getActiveReportersForSubmissionCheck をスタブ化（5名を返す）
    const reporters = [
      { reporterId: 'reporter-001', name: 'Reporter 001', email: 'reporter001@example.com', department: 'Dept A' },
      { reporterId: 'reporter-002', name: 'Reporter 002', email: 'reporter002@example.com', department: 'Dept A' },
      { reporterId: 'reporter-003', name: 'Reporter 003', email: 'reporter003@example.com', department: 'Dept A' },
      { reporterId: 'reporter-004', name: 'Reporter 004', email: 'reporter004@example.com', department: 'Dept A' },
      { reporterId: 'reporter-005', name: 'Reporter 005', email: 'reporter005@example.com', department: 'Dept A' },
    ];
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck').mockResolvedValue(reporters);

    // checkDailyReportExistsForDate をスタブ化（提出状況を返す）
    // reporter-001, 003, 005 は提出済み（true）
    // reporter-002, 004 は未提出（false）
    jest.spyOn(dailyReportPersistence, 'checkDailyReportExistsForDate').mockImplementation((reporterId: string) => {
      const submitted = ['reporter-001', 'reporter-003', 'reporter-005'].includes(reporterId);
      return Promise.resolve(submitted);
    });

    // retrieveNonSubmissionDetectionLogsByDate をスタブ化（空配列を返す）
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([]);

    // updateNonSubmissionDetectionLogWithReminderStatus をスタブ化（成功を返す）
    jest.spyOn(dailyReportPersistence, 'updateNonSubmissionDetectionLogWithReminderStatus').mockResolvedValue({
      detectionLogId: 'log-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:05:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 2,
      submittedCount: 3,
    });

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:05:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result = await detectNonSubmittedReportersAtDeadline(input);

    // 検証：出力型を確認
    expect(result).toBeDefined();
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(result.nonSubmittedReporters).toHaveLength(2);

    // 検証：未提出者が正しい順序で含まれている
    expect(result.nonSubmittedReporters[0].userId).toBe('reporter-002');
    expect(result.nonSubmittedReporters[0].userName).toBe('Reporter 002');
    expect(result.nonSubmittedReporters[0].emailAddress).toBe('reporter002@example.com');

    expect(result.nonSubmittedReporters[1].userId).toBe('reporter-004');
    expect(result.nonSubmittedReporters[1].userName).toBe('Reporter 004');
    expect(result.nonSubmittedReporters[1].emailAddress).toBe('reporter004@example.com');

    // 検証：detectionLog が記録されている
    expect(result.detectionLog).toBeDefined();
    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:05:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    // 検証：detectionTimestamp が設定されている
    expect(result.detectionTimestamp).toBe('2024-01-15T17:05:00Z');
  });
});
