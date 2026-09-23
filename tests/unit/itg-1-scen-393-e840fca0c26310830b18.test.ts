import { getActiveReportersForSubmissionCheck, NoActiveReportersError } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-393: 指定日付に有効な報告者が1件も存在しない場合、NoActiveReportersErrorを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return NoActiveReportersError when no active reporters exist', async () => {
    // 過去の営業日を設定
    const pastDate = '2024-01-15'; // 月曜日（営業日）

    const input = {
      targetDate: pastDate,
      teamLeaderId: 'TL001'
    };

    // isBusinessDay スタブを true を返すように設定（指定日付が営業日であることを模擬）
    (isBusinessDay as jest.Mock).mockResolvedValue(true);

    // getActiveReportersForSubmissionCheck 処理を呼び出す
    // すべての報告者マスタレコードが有効でないことを模擬したシナリオで実行
    const result = await getActiveReportersForSubmissionCheck(input);

    // 期待結果を確認
    expect(result.success).toBe(false);
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.message).toBe('指定日付に日報提出対象の有効な報告者が存在しません。');
    expect(result.error).toBeInstanceOf(NoActiveReportersError);
    expect(result.errorName).toBe('NoActiveReportersError');
  });
});
