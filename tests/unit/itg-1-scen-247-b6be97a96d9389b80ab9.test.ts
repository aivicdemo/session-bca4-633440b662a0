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

import { detectNonSubmittedReportersAtDeadline, InvalidReporterDataError } from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;

describe('SCEN-247: リーダーのメールアドレスが登録されていない場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('メールアドレスが設定されていない報告者がある場合、エラーを throw する', async () => {
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    const reportersWithMissingEmails = [
      { userId: 'user-001', name: 'Reporter 1', email: 'reporter1@example.com', department: 'Sales' },
      { userId: 'user-002', name: 'Reporter 2', email: 'reporter2@example.com', department: 'Marketing' },
      { userId: 'user-003', name: 'Reporter 3', email: 'reporter3@example.com', department: 'Engineering' },
      { userId: 'user-004', name: 'Reporter 4', email: '', department: 'Sales' },
      { userId: 'user-005', name: 'Reporter 5', email: '', department: 'HR' },
    ];

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(reportersWithMissingEmails);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:30:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      })
    ).rejects.toThrow();
  });
});
