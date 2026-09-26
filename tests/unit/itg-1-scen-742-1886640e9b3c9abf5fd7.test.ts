import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterValidationModule from '../../src/logic/reporter-master-management';

describe('SCEN-742: 本日未提出の報告者が検知され、その報告者のみにリマインダーが送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('アクティブな報告者のみがリマインダー対象として返される', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay' as any).mockResolvedValue(true);
    jest.spyOn(reporterValidationModule, 'isReporterActiveAndValid' as any)
      .mockImplementation(async (input: any) => {
        // reporterA (R001) と reporterC (R003) は有効、reporterB (R002) は無効
        return input.reporterId === 'R001' || input.reporterId === 'R003';
      });

    const targetDate = new Date('2024-01-15'); // 月曜日（営業日）
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // (1) success が true
    expect(result.success).toBe(true);

    // (2) reporters 配列の長さが 2
    expect(result.reporters.length).toBe(2);

    // (3) 最初の要素が status=active を含む
    expect(result.reporters[0]).toHaveProperty('status');
    expect(result.reporters[0].status).toBe('active');

    // (4) 2番目の要素が status=active を含む
    expect(result.reporters[1]).toHaveProperty('status');
    expect(result.reporters[1].status).toBe('active');

    // (5) totalCount が 2
    expect(result.totalCount).toBe(2);

    // message に成功を示すテキスト
    expect(result.message.length).toBeGreaterThan(0);
  });
});
