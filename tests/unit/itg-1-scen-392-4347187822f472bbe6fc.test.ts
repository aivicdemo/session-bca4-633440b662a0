import { getActiveReportersForSubmissionCheck, TargetDateInvalidError } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-392: 指定日付が将来日である場合、TargetDateInvalidErrorを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return TargetDateInvalidError when targetDate is in the future', async () => {
    // 入力値の準備
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYYYYMMDD = tomorrow.toISOString().split('T')[0];

    const input = {
      targetDate: tomorrowYYYYMMDD,
      teamLeaderId: 'TL-001'
    };

    // getActiveReportersForSubmissionCheck を実行
    const result = await getActiveReportersForSubmissionCheck(input);

    // 期待結果を確認
    expect(result.success).toBe(false);
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.message).toBe('提出対象日付は営業日かつ本日以前である必要があります。');
    expect(result.error).toBeInstanceOf(TargetDateInvalidError);
    expect(result.errorName).toBe('TargetDateInvalidError');
  });
});
