jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import {
  checkDailyReportExistsForDate,
  retrieveNonSubmissionDetectionLogsByDate,
  updateNonSubmissionDetectionLogWithReminderStatus,
} from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockedUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<any>;

describe('SCEN-256: 業務ルール br-tx_1-005 の制約 8 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('期限時刻到達時点で、提出状況に応じて未提出者を検知し、ログに記録される', async () => {
    const mockReporters = [
      { userId: 'reporter-001', userName: '報告者1', emailAddress: 'r001@example.com', departmentId: 'dept-001' },
      { userId: 'reporter-002', userName: '報告者2', emailAddress: 'r002@example.com', departmentId: 'dept-001' },
      { userId: 'reporter-003', userName: '報告者3', emailAddress: 'r003@example.com', departmentId: 'dept-001' },
      { userId: 'reporter-004', userName: '報告者4', emailAddress: 'r004@example.com', departmentId: 'dept-001' },
      { userId: 'reporter-005', userName: '報告者5', emailAddress: 'r005@example.com', departmentId: 'dept-001' },
    ];

    const submittedReporterIds = ['reporter-001', 'reporter-002', 'reporter-003'];

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(mockReporters);
    mockedCheckDailyReportExistsForDate.mockImplementation((reporterId: string) => {
      return Promise.resolve(submittedReporterIds.includes(reporterId));
    });
    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline(input as any);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0].userId).toBe('reporter-004');
    expect(result.nonSubmittedReporters[1].userId).toBe('reporter-005');
    expect(result.nonSubmittedReporters[0]).toHaveProperty('userName');
    expect(result.nonSubmittedReporters[0]).toHaveProperty('emailAddress');

    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:00:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
