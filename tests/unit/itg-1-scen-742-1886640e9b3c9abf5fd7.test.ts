import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ActiveReporterInfo,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-742: 本日未提出の報告者が検知され、その報告者のみにリマインダーが送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('status=activeの報告者のみが検索結果に含まれる', async () => {
    // テスト前提：本日より前の営業日を targetDate に設定
    const targetDate = new Date('2024-01-15'); // 月曜日
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化し、targetDate が営業日として true を返す
    jest.mocked(businessDayModule.isBusinessDay).mockResolvedValue(true);

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // getActiveReportersForSubmissionCheck を呼び出す
    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // 出力型を検証
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);

    // reporters 配列に status=active の報告者のみが含まれていることを確認
    // (1) reporters 配列の長さが2である
    expect(result.reporters.length).toBe(2);

    // (2) reporters 配列の最初の要素が status=active を含む
    expect(result.reporters[0]).toHaveProperty('status');
    expect(result.reporters[0].status).toBe('active');

    // (3) reporters 配列の2番目の要素が status=active を含む
    expect(result.reporters[1]).toHaveProperty('status');
    expect(result.reporters[1].status).toBe('active');

    // (4) totalCount が2である
    expect(result.totalCount).toBe(2);

    // (5) message に成功を示すテキストが含まれる
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });
});
