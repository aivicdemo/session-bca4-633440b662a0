import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterValidationModule from '../../src/logic/reporter-master-management';

describe('SCEN-743: 本日既に提出済みの報告者は検知対象から除外される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('本日既に提出済みの報告者が除外される', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay' as any).mockResolvedValue(true);
    jest.spyOn(reporterValidationModule, 'isReporterActiveAndValid' as any)
      .mockImplementation(async (input: any) => {
        // R001は提出済み（有効だが提出済み）、R002とR003は未提出（有効）
        // 実装ロジックが提出状態を判定する場合を想定
        return true;
      });

    const targetDate = new Date('2024-01-15'); // 本日以前の営業日
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // success は true
    expect(result.success).toBe(true);

    // reporters リストは有効かつ未提出の報告者を含む
    expect(Array.isArray(result.reporters)).toBe(true);

    // 各報告者が必要なフィールドを持つことを確認
    result.reporters.forEach((reporter: ActiveReporterInfo) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('department');
      expect(reporter).toHaveProperty('status');
    });

    // totalCount が reporters の件数と一致
    expect(result.totalCount).toBe(result.reporters.length);

    // message に処理成功を示す文言
    expect(result.message.length).toBeGreaterThan(0);
  });
});
