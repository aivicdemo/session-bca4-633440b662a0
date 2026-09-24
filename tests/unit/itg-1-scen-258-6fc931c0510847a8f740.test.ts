jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
}));

import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DetectNonSubmittedReportersAtDeadlineOutput,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { checkDailyReportExistsForDate } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.Mock;

describe('SCEN-258: 業務ルール br-tx_1-005 の制約 10 が設計どおりに働く', () => {
  const targetDate = '2024-01-15';
  const submissionDeadlineTime = '17:00';
  const currentDateTime = '2024-01-15T17:00:00Z';
  const teamId = 'TEAM-001';

  // テスト対象チームの有効な報告者5名
  const activeReporters = [
    {
      userId: 'U001',
      userName: '報告者A',
      emailAddress: 'reporter-a@example.com',
      departmentId: 'DEPT-001',
      status: 'active',
    },
    {
      userId: 'U002',
      userName: '報告者B',
      emailAddress: 'reporter-b@example.com',
      departmentId: 'DEPT-001',
      status: 'active',
    },
    {
      userId: 'U003',
      userName: '報告者C',
      emailAddress: 'reporter-c@example.com',
      departmentId: 'DEPT-001',
      status: 'active',
    },
    {
      userId: 'U004',
      userName: '報告者D',
      emailAddress: 'reporter-d@example.com',
      departmentId: 'DEPT-001',
      status: 'active',
    },
    {
      userId: 'U005',
      userName: '報告者E',
      emailAddress: 'reporter-e@example.com',
      departmentId: 'DEPT-001',
      status: 'active',
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    // Step 20: judgeSchedulerExecutionTiming をスタブ化し、「期限に達している」を返すよう設定
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      isDeadlineReached: true,
      currentTime: currentDateTime,
      deadlineTime: `${targetDate}T${submissionDeadlineTime}:00Z`,
    });

    // Step 21: getActiveReportersForSubmissionCheck をスタブ化し、5名全員の有効な報告者を返すよう設定
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: activeReporters,
      totalCount: 5,
    });

    // Step 22: checkDailyReportExistsForDate をスタブ化し、報告者A,B,Cは期限内に提出済み、
    // 報告者D,Eは未提出を返すよう設定
    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      const submittedUserIds = ['U001', 'U002', 'U003'];
      return Promise.resolve({
        exists: submittedUserIds.includes(userId),
        userId,
      });
    });
  });

  it('定時に日報提出期限を迎えた時点で、本日未提出の報告者を自動検知し、未提出者一覧と検知ログを生成する', async () => {
    // Step 9-23: detectNonSubmittedReportersAtDeadline を入力型の値で呼び出す
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate,
      submissionDeadlineTime,
      currentDateTime,
      teamId,
    };

    const result: DetectNonSubmittedReportersAtDeadlineOutput =
      await detectNonSubmittedReportersAtDeadline(input);

    // Step 24: 出力型 nonSubmittedReporters の配列から報告者D,EのユーザーID・氏名・メールアドレス・所属を確認
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(result.nonSubmittedReporters).toHaveLength(2);

    const reporterDData = result.nonSubmittedReporters.find(
      (r: any) => r.userId === 'U004'
    );
    expect(reporterDData).toBeDefined();
    expect(reporterDData.userId).toBe('U004');
    expect(reporterDData.userName).toBe('報告者D');
    expect(reporterDData.emailAddress).toBe('reporter-d@example.com');
    expect(reporterDData.departmentId).toBe('DEPT-001');

    const reporterEData = result.nonSubmittedReporters.find(
      (r: any) => r.userId === 'U005'
    );
    expect(reporterEData).toBeDefined();
    expect(reporterEData.userId).toBe('U005');
    expect(reporterEData.userName).toBe('報告者E');
    expect(reporterEData.emailAddress).toBe('reporter-e@example.com');
    expect(reporterEData.departmentId).toBe('DEPT-001');

    // Step 25: 出力型 detectionLog が本日の日付、検知対象者数5、未提出者数2を記録していることを確認
    expect(result.detectionLog).toBeDefined();
    expect(result.detectionLog.detectionDate).toBe(targetDate);
    expect(result.detectionLog.totalCheckCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    // Step 26: 出力型 detectionTimestamp が指定した currentDateTime と等しいことを確認
    expect(result.detectionTimestamp).toBe(currentDateTime);

    // Step 1 検証: エラーは発生しないこと
    expect(result.errors).toBeUndefined();
  });
});
