import { getActiveReportersForSubmissionCheck, ReporterMasterAccessError } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-394: 報告者マスタデータへのアクセスに失敗した場合、ReporterMasterAccessErrorを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return ReporterMasterAccessError when reporter master access fails', async () => {
    // isBusinessDay スタブを営業日判定が true を返すように設定
    (isBusinessDay as jest.Mock).mockResolvedValue(true);

    // 入力値を設定
    const input = {
      targetDate: '2024-01-15', // 営業日・本日以前
      teamLeaderId: 'leader-001'
    };

    // getActiveReportersForSubmissionCheck を実行
    // 報告者マスタデータへのアクセス処理が例外をスロー、またはnullを返すようにシミュレート
    const result = await getActiveReportersForSubmissionCheck(input);

    // 期待結果を確認
    expect(result.success).toBe(false);
    expect(result.message).toBe('報告者マスタの取得に失敗しました。');
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.error).toBeInstanceOf(ReporterMasterAccessError);
    expect(result.errorName).toBe('ReporterMasterAccessError');
  });
});
