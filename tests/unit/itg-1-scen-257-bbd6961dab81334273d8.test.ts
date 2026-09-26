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

describe('SCEN-257: 業務ルール br-tx_1-005 の制約 9 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('複数の未提出者を正確に検知し、各自の情報をログに記録する', async () => {
    const mockReporters = [
      { userId: 'reporter-001', userName: '報告者1', emailAddress: 'reporter-001@example.com', departmentId: '営業部' },
      { userId: 'reporter-002', userName: '報告者2', emailAddress: 'reporter-002@example.com', departmentId: '営業部' },
      { userId: 'reporter-003', userName: '報告者3', emailAddress: 'reporter-003@example.com', departmentId: '営業部' },
      { userId: 'reporter-004', userName: '報告者4', emailAddress: 'reporter-004@example.com', departmentId: '営業部' },
      { userId: 'reporter-005', userName: '報告者5', emailAddress: 'reporter-005@example.com', departmentId: '営業部' },
    ];

    const submittedReporterIds = ['reporter-001', 'reporter-003'];

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

    expect(result.nonSubmittedReporters).toHaveLength(3);
    expect(result.nonSubmittedReporters.map((r: any) => r.userId)).toEqual(expect.arrayContaining(['reporter-002', 'reporter-004', 'reporter-005']));

    result.nonSubmittedReporters.forEach((reporter: any) => {
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('userName');
      expect(reporter).toHaveProperty('emailAddress');
    });

    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:00:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(3);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
