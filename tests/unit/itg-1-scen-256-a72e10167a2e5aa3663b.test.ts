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

describe('SCEN-256: 業務ルール br-tx_1-005 の制約 8 が設計どおりに働く', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('制約8: 報告者2名と3名が未提出で、全フィールドが検知ログに記録される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
        { userId: 'reporter-001', name: '報告者1', email: 'r001@example.com', department: '営業部', status: 'active' },
        { userId: 'reporter-002', name: '報告者2', email: 'r002@example.com', department: '営業部', status: 'active' },
        { userId: 'reporter-003', name: '報告者3', email: 'r003@example.com', department: '営業部', status: 'active' },
        { userId: 'reporter-004', name: '報告者4', email: 'r004@example.com', department: '営業部', status: 'active' },
        { userId: 'reporter-005', name: '報告者5', email: 'r005@example.com', department: '営業部', status: 'active' },
      ],
      totalCount: 5,
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      success: true,
      submitted: [
        { userId: 'reporter-001', submittedAt: '2024-01-15T16:30:00Z' },
        { userId: 'reporter-002', submittedAt: '2024-01-15T16:40:00Z' },
        { userId: 'reporter-003', submittedAt: '2024-01-15T16:50:00Z' },
      ],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline(input as any);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.map((r: any) => r.userId)).toEqual(expect.arrayContaining(['reporter-004', 'reporter-005']));
    expect(result.detectionLog.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);
    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
