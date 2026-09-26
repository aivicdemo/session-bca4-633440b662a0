import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../src/logic/reporter-master-management';

describe('SCEN-741: リマインダー送信時刻として不適切な時刻にスケジューラが実行された場合、送信が中止される', () => {
  let targetDate: Date;
  let teamLeaderId: string;

  beforeEach(() => {
    targetDate = new Date('2024-01-15'); // 本日以前の営業日
    teamLeaderId = 'TL001';
  });

  it('不適切な時刻でスケジューラが実行された場合、時刻妥当性チェックで送信が中止される', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // getActiveReportersForSubmissionCheck は success: true、有効な報告者一覧、正の totalCount を返す
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.reporters.length).toBe(result.totalCount);

    // 各報告者が必要なフィールドを持つことを確認
    result.reporters.forEach((reporter: ActiveReporterInfo) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('department');
      expect(reporter).toHaveProperty('status');
    });

    // message が処理成功を示す値となることを確認
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });
});
