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
  NonSubmissionDetectionLog,
} from '../../src/logic/daily-report-non-submission-detection';
import type { NonSubmittedReporter } from '../../src/agents/tx-3-imp-1/orchestrator';
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
        userName: 'Reporter One',
        emailAddress: 'reporter-001@example.com',
        promptPriority: 'high',
        department: 'Engineering',
      },
      {
        userId: 'reporter-002',
        userName: 'Reporter Two',
        emailAddress: 'reporter-002@example.com',
        promptPriority: 'high',
        department: 'Engineering',
      },
      {
        userId: 'reporter-003',
        userName: 'Reporter Three',
        emailAddress: 'reporter-003@example.com',
        promptPriority: 'high',
        department: 'Sales',
      },
      {
        userId: 'reporter-004',
        userName: 'Reporter Four',
        emailAddress: 'reporter-004@example.com',
        promptPriority: 'high',
        department: 'Sales',
      },
      {
        userId: 'reporter-005',
        userName: 'Reporter Five',
        emailAddress: 'reporter-005@example.com',
        promptPriority: 'high',
        department: 'Marketing',
      },
    ];

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(mockReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      const submittedUserIds = ['reporter-001', 'reporter-002', 'reporter-003'];
      return Promise.resolve({ exists: submittedUserIds.includes(userId) });
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue({
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

    // Verify reporter-004
    const reporter004 = result.nonSubmittedReporters.find(r => r.userId === 'reporter-004');
    expect(reporter004).toBeDefined();
    expect(reporter004?.userId).toBe('reporter-004');
    expect(reporter004?.userName).toBe('Reporter Four');
    expect(reporter004?.emailAddress).toBe('reporter-004@example.com');
    expect(reporter004?.department).toBe('Sales');

    // Verify reporter-005
    const reporter005 = result.nonSubmittedReporters.find(r => r.userId === 'reporter-005');
    expect(reporter005).toBeDefined();
    expect(reporter005?.userId).toBe('reporter-005');
    expect(reporter005?.userName).toBe('Reporter Five');
    expect(reporter005?.emailAddress).toBe('reporter-005@example.com');
    expect(reporter005?.department).toBe('Marketing');

    expect(result.detectionLog.detectionDateTime).toBe(currentDateTime);
    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe(currentDateTime);

    expect(mockedUpdateNonSubmissionDetectionLogWithReminderStatus).toHaveBeenCalledTimes(1);
  });
});
