jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));

import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  NoActiveReportersError,
} from '../../src/logic/daily-report-non-submission-detection';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;

describe('SCEN-260: チームメンバーが空の場合の detectUnsubmittedMembers 処理を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームメンバーが登録されていない場合、NoActiveReportersError が例外として送出される', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:30:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([]);

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    };

    const error = await detectNonSubmittedReportersAtDeadline(input).catch((e) => e);

    expect(error).toBeInstanceOf(NoActiveReportersError);
    expect(error.message).toBe('検知対象の有効な報告者が存在しません。');
  });
});
