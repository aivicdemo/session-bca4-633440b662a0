jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
  updateNonSubmissionDetectionLogWithReminderStatus: jest.fn(),
}));

import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import {
  checkDailyReportExistsForDate,
  retrieveNonSubmissionDetectionLogsByDate,
  updateNonSubmissionDetectionLogWithReminderStatus,
} from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.Mock;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.Mock;
const mockedUpdateNonSubmissionDetectionLogWithReminderStatus = updateNonSubmissionDetectionLogWithReminderStatus as jest.Mock;

describe('SCEN-259: 業務ルール br-tx_1-005 の制約 11 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('定時に日報提出期限を迎えた時点で、本日未提出の報告者を自動検知し、未提出者一覧と検知ログを生成する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    const mockReporters = [
      {
        userId: 'reporter-001',
        name: 'Reporter One',
        email: 'reporter-001@example.com',
        department: 'Engineering',
      },
      {
        userId: 'reporter-002',
        name: 'Reporter Two',
        email: 'reporter-002@example.com',
        department: 'Engineering',
      },
      {
        userId: 'reporter-003',
        name: 'Reporter Three',
        email: 'reporter-003@example.com',
        department: 'Sales',
      },
      {
        userId: 'reporter-004',
        name: 'Reporter Four',
        email: 'reporter-004@example.com',
        department: 'Sales',
      },
      {
        userId: 'reporter-005',
        name: 'Reporter Five',
        email: 'reporter-005@example.com',
        department: 'Marketing',
      },
    ];

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(mockReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      const submittedUserIds = ['reporter-001', 'reporter-002', 'reporter-003'];
      return Promise.resolve(submittedUserIds.includes(userId));
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue({
      detectionLogId: 'log-001',
      targetDate,
      detectionDateTime: currentDateTime,
      targetCount: 5,
      nonSubmittedCount: 2,
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
    expect(result.nonSubmittedReporters[0].name).toBe('Reporter Four');
    expect(result.nonSubmittedReporters[0].email).toBe('reporter-004@example.com');
    expect(result.nonSubmittedReporters[0].department).toBe('Sales');

    expect(result.nonSubmittedReporters[1].userId).toBe('reporter-005');
    expect(result.nonSubmittedReporters[1].name).toBe('Reporter Five');
    expect(result.nonSubmittedReporters[1].email).toBe('reporter-005@example.com');
    expect(result.nonSubmittedReporters[1].department).toBe('Marketing');

    expect(result.detectionLog.detectionDateTime).toBe(currentDateTime);
    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.targetCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe(currentDateTime);

    expect(mockedUpdateNonSubmissionDetectionLogWithReminderStatus).toHaveBeenCalledTimes(1);
  });
});
