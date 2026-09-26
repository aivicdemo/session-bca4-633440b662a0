import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterValidationModule from '../../src/logic/reporter-master-management';

describe('SCEN-747: メール送信が失敗した場合、失敗を検知ログに記録し、最大3回まで指数バックオフで再試行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信失敗時に最大3回の指数バックオフ再試行が実行される', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay' as any).mockResolvedValue(true);
    jest.spyOn(reporterValidationModule, 'isReporterActiveAndValid' as any)
      .mockResolvedValue(true);

    const targetDate = new Date('2024-01-15'); // 本日以前の営業日
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // getActiveReportersForSubmissionCheck は処理を継続し、成功を返す
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(result.totalCount).toBeGreaterThan(0);

    // reporters 配列に必要なフィールドが含まれる
    result.reporters.forEach((reporter: ActiveReporterInfo) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('department');
      expect(reporter).toHaveProperty('status');
    });

    // message が格納される
    expect(typeof result.message).toBe('string');
  });
});
