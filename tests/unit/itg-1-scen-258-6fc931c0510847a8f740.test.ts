jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { checkDailyReportExistsForDate } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;

describe('SCEN-258: 業務ルール br-tx_1-005 の制約 10 が設計どおりに働く', () => {
  const targetDate = '2024-01-15';
  const submissionDeadlineTime = '17:00';
  const currentDateTime = '2024-01-15T17:00:00Z';
  const teamId = 'TEAM-001';

  const activeReporters = [
    { userId: 'U001', userName: '報告者A', emailAddress: 'reporter-a@example.com', departmentId: 'DEPT-001' },
    { userId: 'U002', userName: '報告者B', emailAddress: 'reporter-b@example.com', departmentId: 'DEPT-001' },
    { userId: 'U003', userName: '報告者C', emailAddress: 'reporter-c@example.com', departmentId: 'DEPT-001' },
    { userId: 'U004', userName: '報告者D', emailAddress: 'reporter-d@example.com', departmentId: 'DEPT-001' },
    { userId: 'U005', userName: '報告者E', emailAddress: 'reporter-e@example.com', departmentId: 'DEPT-001' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(activeReporters);

    mockedCheckDailyReportExistsForDate.mockImplementation((userId: string) => {
      const submittedUserIds = ['U001', 'U002', 'U003'];
      return Promise.resolve(submittedUserIds.includes(userId));
    });
  });

  it('制約10: 定時に日報提出期限を迎えた時点で、本日未提出の報告者を自動検知し、未提出者一覧と検知ログを生成する', async () => {
    const input = {
      targetDate,
      submissionDeadlineTime,
      currentDateTime,
      teamId,
    };

    const result = await detectNonSubmittedReportersAtDeadline(input as any);

    expect(result.nonSubmittedReporters).toHaveLength(2);

    const reporterD = result.nonSubmittedReporters.find((r: any) => r.userId === 'U004');
    expect(reporterD).toBeDefined();
    expect(reporterD.userId).toBe('U004');
    expect(reporterD.userName).toBe('報告者D');
    expect(reporterD.emailAddress).toBe('reporter-d@example.com');

    const reporterE = result.nonSubmittedReporters.find((r: any) => r.userId === 'U005');
    expect(reporterE).toBeDefined();
    expect(reporterE.userId).toBe('U005');
    expect(reporterE.userName).toBe('報告者E');
    expect(reporterE.emailAddress).toBe('reporter-e@example.com');

    expect(result.detectionLog.targetDate).toBe(targetDate);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);

    expect(result.detectionTimestamp).toBe(currentDateTime);
  });
});
