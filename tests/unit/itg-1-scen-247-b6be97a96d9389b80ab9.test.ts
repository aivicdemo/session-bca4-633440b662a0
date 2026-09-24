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
  DeadlineNotReachedError,
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

describe('SCEN-247: リーダーのメールアドレスが登録されていない場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('リーダーのメールアドレスが未設定の場合、リーダーメール検証エラーを送出する', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
        { userId: 'U001', name: '報告者1', email: 'r001@example.com', department: '営業部', status: 'active' },
        { userId: 'U002', name: '報告者2', email: 'r002@example.com', department: '営業部', status: 'active' },
        { userId: 'U003', name: '報告者3', email: 'r003@example.com', department: '営業部', status: 'active' },
        { userId: 'U004', name: '報告者4', email: null, department: '営業部', status: 'active' },
        { userId: 'U005', name: '報告者5', email: null, department: '営業部', status: 'active' },
      ],
      totalCount: 5,
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      success: true,
      submitted: [
        { userId: 'U001', submittedAt: '2024-01-15T16:30:00Z' },
        { userId: 'U002', submittedAt: '2024-01-15T16:45:00Z' },
      ],
    });

    let error: any = null;
    try {
      await detectNonSubmittedReportersAtDeadline(input as any);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('リーダーのメールアドレスを設定してください');
    expect(mockedRetrieveNonSubmissionDetectionLogsByDate).not.toHaveBeenCalled();
    expect(mockedUpdateNonSubmissionDetectionLogWithReminderStatus).not.toHaveBeenCalled();
  });
});
