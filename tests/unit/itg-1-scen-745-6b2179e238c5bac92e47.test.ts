jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));

import { getActiveReportersForSubmissionCheck, ReporterMasterAccessError } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;

describe('SCEN-745: 報告者IDが空または不正な形式の場合、エラーが発生し処理が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('teamLeaderIdが空文字列の場合、ReporterMasterAccessErrorを返す', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = '';

    mockedIsBusinessDay.mockResolvedValue(true);

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(false);
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.message).toContain('報告者マスタの取得に失敗しました。');
  });

  it('teamLeaderIdが数値の場合、ReporterMasterAccessErrorを返す', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = '12345';

    mockedIsBusinessDay.mockResolvedValue(true);

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(false);
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.message).toContain('報告者マスタの取得に失敗しました。');
  });

  it('teamLeaderIdが記号のみの場合、ReporterMasterAccessErrorを返す', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = '!!!';

    mockedIsBusinessDay.mockResolvedValue(true);

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(false);
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.message).toContain('報告者マスタの取得に失敗しました。');
  });
});
