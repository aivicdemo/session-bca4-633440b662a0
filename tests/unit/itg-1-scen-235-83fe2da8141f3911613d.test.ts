import { detectNonSubmittedReportersAtDeadline, NoActiveReportersError } from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-235: チームメンバーIDが空の場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('teamId が空文字列で getActiveReportersForSubmissionCheck が空配列を返す場合は NoActiveReportersError をスロー', async () => {
    // judgeSchedulerExecutionTiming をスタブ化（期限に達している）
    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming').mockResolvedValue(true);

    // getActiveReportersForSubmissionCheck をスタブ化（空配列を返す）
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck').mockResolvedValue([]);

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: '',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow(NoActiveReportersError);

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(error.message).toContain('検知対象の有効な報告者が存在しません。');
    }
  });
});
