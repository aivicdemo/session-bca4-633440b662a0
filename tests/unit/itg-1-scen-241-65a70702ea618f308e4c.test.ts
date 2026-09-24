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

describe('SCEN-241: 報告者ごとの提出状況を提出時刻付きで正しく識別して返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('未提出者と提出済み者を正しく識別し、未提出者のみを返す', async () => {
    const targetDate = '2024-01-15';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';
    const currentDateTime = '2024-01-15T17:30:00Z';

    mockedJudgeSchedulerExecutionTiming.mockReturnValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockReturnValue([
      {
        userId: 'reporter-001',
        userName: '太郎',
        emailAddress: 'taro@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-002',
        userName: '花子',
        emailAddress: 'hanako@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-003',
        userName: '次郎',
        emailAddress: 'jiro@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-004',
        userName: '美咲',
        emailAddress: 'misaki@example.com',
        department: '営業部',
      },
      {
        userId: 'reporter-005',
        userName: '健太',
        emailAddress: 'kenta@example.com',
        department: '営業部',
      },
    ]);

    mockedCheckDailyReportExistsForDate.mockReturnValue({
      'reporter-001': { submitted: true, submittedAt: '2024-01-15T16:45:00Z' },
      'reporter-002': { submitted: true, submittedAt: '2024-01-15T17:15:00Z' },
      'reporter-003': { submitted: false },
      'reporter-004': { submitted: true, submittedAt: '2024-01-15T16:30:00Z' },
      'reporter-005': { submitted: false },
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockReturnValue([]);

    mockedUpdateNonSubmissionDetectionLogWithReminderStatus.mockReturnValue({
      detectionLogId: 'log-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:30:00Z',
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
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'reporter-003',
      userName: '次郎',
      emailAddress: 'jiro@example.com',
      department: '営業部',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'reporter-005',
      userName: '健太',
      emailAddress: 'kenta@example.com',
      department: '営業部',
    });

    const ids = result.nonSubmittedReporters.map((r) => r.userId);
    expect(ids).not.toContain('reporter-001');
    expect(ids).not.toContain('reporter-002');
    expect(ids).not.toContain('reporter-004');

    expect(result.detectionLog).toMatchObject({
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:30:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 2,
      submittedCount: 3,
    });

    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
