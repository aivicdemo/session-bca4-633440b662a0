import { jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  NoActiveReportersError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';

describe('SCEN-260: detectNonSubmittedReportersAtDeadline - チームメンバー空時 NoActiveReportersError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームメンバーが登録されていない場合、NoActiveReportersError を送出する', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:30:00Z'; // 提出期限17:00を超えた時刻
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    jest
      .spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming')
      .mockResolvedValue(true);

    jest
      .spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck')
      .mockResolvedValue([]); // チームメンバーが0名

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      NoActiveReportersError,
    );

    const error = await detectNonSubmittedReportersAtDeadline(input).catch((e) => e);
    expect(error.message).toBe('検知対象の有効な報告者が存在しません。');
  });
});
