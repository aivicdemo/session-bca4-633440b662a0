import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ActiveReporterInfo,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-739: 営業日の定時にスケジューラが実行され、アクティブな報告者へリマインダーが送信され、検知ログが記録される', () => {
  let targetDate: Date;
  let teamLeaderId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    targetDate = new Date('2024-01-15'); // 月曜日（営業日）
    teamLeaderId = 'TL001';
  });

  it('本日を営業日とした日付でアクティブな報告者一覧を取得できる', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // 1. 戻り値の success が true であることを確認する
    expect(result.success).toBe(true);

    // 2. 戻り値の reporters 配列に ActiveReporterInfo の各フィールドが含まれていることを確認する
    expect(Array.isArray(result.reporters)).toBe(true);
    result.reporters.forEach((reporter: ActiveReporterInfo) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('department');
      expect(reporter).toHaveProperty('status');
    });

    // 3. 戻り値の reporters 配列の要素数が 1 以上 5 以下であることを確認する
    expect(result.reporters.length).toBeGreaterThanOrEqual(1);
    expect(result.reporters.length).toBeLessThanOrEqual(5);

    // 4. 戻り値の totalCount が reporters 配列の要素数と一致することを確認する
    expect(result.totalCount).toBe(result.reporters.length);

    // 5. 戻り値の message に処理結果メッセージが格納されていることを確認する
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });
});
