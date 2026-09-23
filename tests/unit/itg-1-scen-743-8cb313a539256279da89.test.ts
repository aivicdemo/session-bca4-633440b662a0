import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-743: 本日既に提出済みの報告者は検知対象から除外される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('本日提出済みの報告者R001が結果から除外され、未提出者R002とR003のみが含まれる', async () => {
    // テスト前提：本日以前の営業日を targetDate に設定（例：2024年1月15日（月））
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化し、targetDate が営業日であることを返す
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // isReporterActiveAndValid をスタブ化
    // 各reporterIdに対して有効な報告者情報を返す
    jest.mocked(isReporterActiveAndValid).mockImplementation(async () => {
      return true;
    });

    // getActiveReportersForSubmissionCheck を呼び出す
    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    // 戻り値のreportersフィールドを検査
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);

    // 本日既に提出済みの報告者'R001'が一覧から除外されていることを確認
    const reporterIds = result.reporters.map((r) => r.reporterId);
    expect(reporterIds).not.toContain('R001');

    // 戻り値のreportersフィールドに未提出者'R002'と'R003'のみが含まれていることを確認
    expect(reporterIds).toContain('R002');
    expect(reporterIds).toContain('R003');

    // 戻り値のtotalCountが2（提出対象の有効報告者数）であることを確認
    expect(result.totalCount).toBe(2);

    // 戻り値のsuccessがtrueであることを確認
    expect(result.success).toBe(true);

    // messageには処理成功を示す文言が格納されることを確認
    expect(typeof result.message).toBe('string');
  });
});
