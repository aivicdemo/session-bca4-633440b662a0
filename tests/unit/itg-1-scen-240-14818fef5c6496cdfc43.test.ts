jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));

import { detectNonSubmittedReportersAtDeadline, DeadlineNotReachedError } from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;

const REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
];

describe('SCEN-240: 現在時刻が提出期限より前の場合は検知をスキップする', () => {
  const targetDate = '2024-01-15';
  const currentDateTime = '2024-01-15T16:30:00Z';
  const submissionDeadlineTime = '17:00';
  const teamId = 'team-001';

  beforeEach(() => {
    jest.resetAllMocks();
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(false);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: REPORTERS,
      totalCount: REPORTERS.length,
      message: '対象報告者を取得しました。',
    });
  });

  it('提出期限前（16:30）では DeadlineNotReachedError が発生し、エラー文言が期待値と一致すること、及び nonSubmittedReporters、detectionLog、detectionTimestamp はいずれも返されないこと', async () => {
    let errorThrown = false;
    let errorMessage = '';

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      });
    } catch (error) {
      errorThrown = true;
      if (error instanceof DeadlineNotReachedError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toBe('日報提出期限に達していないため、未提出者検知を実行できません。');
    expect(mockedJudgeSchedulerExecutionTiming).toHaveBeenCalledWith({
      currentDateTime,
      submissionDeadlineTime,
      targetDate,
      teamId,
    });
  });
});
