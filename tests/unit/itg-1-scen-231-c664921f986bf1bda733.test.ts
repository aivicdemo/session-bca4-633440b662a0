import { detectNonSubmittedReportersAtDeadline, SubmissionStatusCheckFailureError } from '../../src/logic/daily-report-non-submission-detection';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-231: 日報データベースが一時的に取得できない場合は警告を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checkDailyReportExistsForDate が一時的な接続エラーを返す場合は SubmissionStatusCheckFailureError をスロー', async () => {
    // judgeSchedulerExecutionTiming をスタブ化（期限に達している）
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);

    // getActiveReportersForSubmissionCheck をスタブ化（5名を返す）
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck').mockResolvedValue([
      { reporterId: 'reporter-001', name: 'Reporter 001', email: 'reporter001@example.com', department: 'Dept A' },
      { reporterId: 'reporter-002', name: 'Reporter 002', email: 'reporter002@example.com', department: 'Dept A' },
      { reporterId: 'reporter-003', name: 'Reporter 003', email: 'reporter003@example.com', department: 'Dept A' },
      { reporterId: 'reporter-004', name: 'Reporter 004', email: 'reporter004@example.com', department: 'Dept A' },
      { reporterId: 'reporter-005', name: 'Reporter 005', email: 'reporter005@example.com', department: 'Dept A' },
    ]);

    // checkDailyReportExistsForDate をスタブ化（一時的な接続エラーを発生させる）
    jest.spyOn(dailyReportPersistence, 'checkDailyReportExistsForDate').mockRejectedValue(
      new Error('データベース接続エラー')
    );

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow(SubmissionStatusCheckFailureError);

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(error.message).toContain('日報提出状況の確認に失敗しました。');
    }
  });
});
