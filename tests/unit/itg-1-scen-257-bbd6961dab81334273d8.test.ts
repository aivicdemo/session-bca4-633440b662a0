jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reporter-master-management')>('../../src/logic/reporter-master-management'),
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  checkDailyReportExistsForDate: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
  updateNonSubmissionDetectionLogWithReminderStatus: jest.fn(),
}));

import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { checkDailyReportExistsForDate, retrieveNonSubmissionDetectionLogsByDate, updateNonSubmissionDetectionLogWithReminderStatus } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockedUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<any>;

describe('SCEN-257: 業務ルール br-tx_1-005 の制約 9 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('提出状況が提出日時付きで判定され、未提出者3名を正確に検知する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    const activeReporters = [
      { userId: 'reporter-001', userName: '報告者1', emailAddress: 'reporter-001@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-002', userName: '報告者2', emailAddress: 'reporter-002@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-003', userName: '報告者3', emailAddress: 'reporter-003@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-004', userName: '報告者4', emailAddress: 'reporter-004@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'reporter-005', userName: '報告者5', emailAddress: 'reporter-005@example.com', department: '営業部', promptPriority: 'high' },
    ];

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(activeReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      const submittedMap: { [key: string]: string | null } = {
        'reporter-001': '2024-01-15T16:30:00Z',
        'reporter-002': null,
        'reporter-003': '2024-01-15T15:00:00Z',
        'reporter-004': null,
        'reporter-005': null,
      };
      const submittedAt = submittedMap[userId];
      if (submittedAt) {
        return Promise.resolve({ submittedAt });
      }
      return Promise.resolve(null);
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue({ detectionLogId: 'log-001' });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(3);
    expect(result.nonSubmittedReporters.map((r) => r.userId)).toEqual(['reporter-002', 'reporter-004', 'reporter-005']);
    expect(result.nonSubmittedReporters[0].userName).toBe('報告者2');
    expect(result.nonSubmittedReporters[0].emailAddress).toBe('reporter-002@example.com');
    expect(result.nonSubmittedReporters[1].userName).toBe('報告者4');
    expect(result.nonSubmittedReporters[2].userName).toBe('報告者5');

    expect(result.detectionLog.detectionDateTime).toBe('2024-01-15T17:00:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(3);

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
