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

describe('SCEN-249: 未提出者のユーザーID、氏名、メールアドレス、所属を含む一覧を返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('未提出者U002とU004を含む配列が返される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'TEAM-001',
    };

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
        { userId: 'U001', name: '報告者1', email: 'r001@example.com', department: '営業部', status: 'active' },
        { userId: 'U002', name: '報告者2', email: 'r002@example.com', department: '営業部', status: 'active' },
        { userId: 'U003', name: '報告者3', email: 'r003@example.com', department: '営業部', status: 'active' },
        { userId: 'U004', name: '報告者4', email: 'r004@example.com', department: '営業部', status: 'active' },
        { userId: 'U005', name: '報告者5', email: 'r005@example.com', department: '営業部', status: 'active' },
      ],
      totalCount: 5,
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      success: true,
      submitted: [
        { userId: 'U001', submittedAt: '2024-01-15T16:30:00Z' },
        { userId: 'U003', submittedAt: '2024-01-15T16:45:00Z' },
        { userId: 'U005', submittedAt: '2024-01-15T16:50:00Z' },
      ],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue(true);

    const result = await detectNonSubmittedReportersAtDeadline(input as any);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters).toContainEqual(
      expect.objectContaining({
        userId: 'U002',
        reporterName: '報告者2',
        email: 'r002@example.com',
        department: '営業部',
      })
    );
    expect(result.nonSubmittedReporters).toContainEqual(
      expect.objectContaining({
        userId: 'U004',
        reporterName: '報告者4',
        email: 'r004@example.com',
        department: '営業部',
      })
    );
    expect(result.detectionLog.nonSubmittedCount).toBe(2);
    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');
  });
});
