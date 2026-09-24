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

describe('SCEN-251: 全員が期限までに提出しなかった場合は全員が未提出者として返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('全員未提出時に5名全員が未提出者として返される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'TEAM-001',
    };

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
        { userId: 'R001', name: '報告者1', email: 'r001@example.com', department: '営業部', status: 'active' },
        { userId: 'R002', name: '報告者2', email: 'r002@example.com', department: '営業部', status: 'active' },
        { userId: 'R003', name: '報告者3', email: 'r003@example.com', department: '営業部', status: 'active' },
        { userId: 'R004', name: '報告者4', email: 'r004@example.com', department: '営業部', status: 'active' },
        { userId: 'R005', name: '報告者5', email: 'r005@example.com', department: '営業部', status: 'active' },
      ],
      totalCount: 5,
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      success: true,
      submitted: [],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline(input as any);

    expect(result.nonSubmittedReporters).toHaveLength(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(5);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
    expect(result.nonSubmittedReporters.every((r: any) => r.userId && r.reporterName && r.email && r.department)).toBe(true);
  });
});
