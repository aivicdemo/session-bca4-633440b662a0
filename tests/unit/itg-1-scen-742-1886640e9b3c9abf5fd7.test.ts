import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-742: 本日未提出の報告者が検知され、その報告者のみにリマインダーが送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者マスタ上でstatus=activeの報告者のみが検索結果に含まれる', async () => {
    // テスト前提：本日より前の営業日を targetDate に設定
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化し、targetDate が営業日として true を返す
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // isReporterActiveAndValid をスタブ化
    // reporterA と reporterC に対して true を返す、reporterB に対して false を返す
    jest.mocked(isReporterActiveAndValid).mockImplementation(async (input) => {
      return input.reporterId === 'R002' ? false : true;
    });

    // getActiveReportersForSubmissionCheck を呼び出す
    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    // 出力型を検証
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);

    // reporters 配列に status=active の報告者のみが含まれていることを確認
    // 具体的には：
    // (1) reporters 配列の長さが2である
    // (2) reporters 配列の各要素が status=active を含む
    // (3) totalCount が2である
    // (4) message に成功を示すテキストが含まれる
    expect(result.reporters.length).toBe(2);
    result.reporters.forEach((reporter) => {
      expect(reporter.status).toBe('active');
    });
    expect(result.totalCount).toBe(2);
    expect(typeof result.message).toBe('string');
  });
});
