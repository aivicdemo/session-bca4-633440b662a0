import { detectNonSubmittedReportersAtDeadline, DeadlineNotReachedError, SubmissionStatusCheckFailureError } from '../../src/logic/daily-report-non-submission-detection';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-234: 提出期限時刻の有効性を検証し正常系と異なる形式を識別する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 共通のスタブ設定
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck').mockResolvedValue([
      { reporterId: 'reporter-001', name: 'Reporter 001', email: 'reporter001@example.com', department: 'Dept A' },
      { reporterId: 'reporter-002', name: 'Reporter 002', email: 'reporter002@example.com', department: 'Dept A' },
      { reporterId: 'reporter-003', name: 'Reporter 003', email: 'reporter003@example.com', department: 'Dept A' },
      { reporterId: 'reporter-004', name: 'Reporter 004', email: 'reporter004@example.com', department: 'Dept A' },
      { reporterId: 'reporter-005', name: 'Reporter 005', email: 'reporter005@example.com', department: 'Dept A' },
    ]);
    jest.spyOn(dailyReportPersistence, 'checkDailyReportExistsForDate').mockResolvedValue(false);
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([]);
  });

  it('不正形式 "25:00" で DeadlineNotReachedError または SubmissionStatusCheckFailureError をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '25:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(
        error instanceof DeadlineNotReachedError || error instanceof SubmissionStatusCheckFailureError
      ).toBe(true);
    }
  });

  it('不正形式 "ab:cd" で DeadlineNotReachedError または SubmissionStatusCheckFailureError をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: 'ab:cd',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(
        error instanceof DeadlineNotReachedError || error instanceof SubmissionStatusCheckFailureError
      ).toBe(true);
    }
  });

  it('不正形式 "17" で DeadlineNotReachedError または SubmissionStatusCheckFailureError をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(
        error instanceof DeadlineNotReachedError || error instanceof SubmissionStatusCheckFailureError
      ).toBe(true);
    }
  });

  it('不正形式 "17:00:00" で DeadlineNotReachedError または SubmissionStatusCheckFailureError をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(
        error instanceof DeadlineNotReachedError || error instanceof SubmissionStatusCheckFailureError
      ).toBe(true);
    }
  });

  it('不正形式 "" （空文字列）で DeadlineNotReachedError または SubmissionStatusCheckFailureError をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(
        error instanceof DeadlineNotReachedError || error instanceof SubmissionStatusCheckFailureError
      ).toBe(true);
    }
  });
});
