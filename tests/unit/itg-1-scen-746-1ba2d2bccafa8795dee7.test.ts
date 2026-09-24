jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));

import { getActiveReportersForSubmissionCheck, NoActiveReportersError } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;

describe('SCEN-746: リマインダー送信対象が0人の場合、送信処理がスキップされ検知ログのみ記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リマインダー送信対象が存在しない場合、NoActiveReportersErrorが発生する', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    mockedIsBusinessDay.mockResolvedValue(true);

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('指定日付に日報提出対象の有効な報告者が存在しません。');
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
