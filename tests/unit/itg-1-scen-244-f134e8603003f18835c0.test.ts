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

import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
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

describe('SCEN-244: 未提出者一覧と通知送信完了フラグを正しく返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('未提出者一覧と検知ログを正しく返す', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:00:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    mockedJudgeSchedulerExecutionTiming.mockReturnValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockReturnValue([
      { userId: 'user-001', userName: '太郎', emailAddress: 'user001@example.com', department: '営業部' },
      { userId: 'user-002', userName: '花子', emailAddress: 'user002@example.com', department: '営業部' },
      { userId: 'user-003', userName: '次郎', emailAddress: 'user003@example.com', department: '営業部' },
      { userId: 'user-004', userName: '美咲', emailAddress: 'user004@example.com', department: '営業部' },
      { userId: 'user-005', userName: '健太', emailAddress: 'user005@example.com', department: '営業部' },
    ]);

    mockedCheckDailyReportExistsForDate.mockReturnValue({
      'user-001': { submitted: true },
      'user-002': { submitted: true },
      'user-003': { submitted: true },
      'user-004': { submitted: false },
      'user-005': { submitted: false },
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockReturnValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockReturnValue({
      detectionLogId: 'log-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:00:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 2,
      submittedCount: 3,
    });

    const result = await detectNonSubmittedReportersAtDeadline({
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    });

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.map((r) => r.userId)).toEqual(['user-004', 'user-005']);

    expect(result.detectionLog).toMatchObject({
      detectionDateTime: '2024-01-15T17:00:00Z',
      targetDate: '2024-01-15',
      totalReportersCount: 5,
      nonSubmittedCount: 2,
    });

    expect(result.detectionTimestamp).toBe('2024-01-15T17:00:00Z');

    expect(mockedUpdateNonSubmissionDetectionLogWithReminderStatus).toHaveBeenCalledTimes(1);
  });
});
