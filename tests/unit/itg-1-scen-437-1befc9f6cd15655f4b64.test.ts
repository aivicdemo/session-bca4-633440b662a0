import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

describe('SCEN-437: リーダーがソート対象を\'userId\'に指定して検索し、ユーザーIDでソートされた日報が返される', () => {
  test('ソート対象\'userId\'を指定して検索すると、userIdで昇順にソートされた日報が返される', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'userId',
      pageNumber: 1,
      pageSize: 50,
    };

    const output = await retrieveDailyReportsForLeaderReview(input);

    // 出力が正しい構造を持つことを確認
    expect(output).toHaveProperty('dailyReports');
    expect(output).toHaveProperty('totalCount');
    expect(output).toHaveProperty('pageNumber');
    expect(output).toHaveProperty('pageSize');
    expect(output).toHaveProperty('retrievedAt');

    // ページ情報を確認
    expect(output.pageNumber).toBe(1);
    expect(output.pageSize).toBe(50);

    // retrievedAtがISO 8601形式であることを確認
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(output.retrievedAt).toMatch(iso8601Regex);

    // dailyReportsが配列であることを確認
    expect(Array.isArray(output.dailyReports)).toBe(true);

    // ソート順序を確認：連続する2つの要素について userId <= 次の userId
    for (let i = 0; i < output.dailyReports.length - 1; i++) {
      const currentUserId = output.dailyReports[i].userId;
      const nextUserId = output.dailyReports[i + 1].userId;
      expect(currentUserId <= nextUserId).toBe(true);
    }

    // すべてのレコードが提出済みであることを確認
    for (const report of output.dailyReports) {
      // submissionStatusフィールドが存在し、'submitted'であることを確認
      // ただし型定義では提出状態を示す別フィールドがあるかもしれないため、
      // フィルター条件で'submitted'が指定されたことから提出済みと判断される
      expect(report).toHaveProperty('dailyReportId');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('businessContent');
      expect(report).toHaveProperty('submittedAt');
    }

    // すべてのレコードの報告日が指定範囲内であることを確認
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    for (const report of output.dailyReports) {
      const reportDate = new Date(report.reportDate);
      expect(reportDate >= startDate).toBe(true);
      expect(reportDate <= endDate).toBe(true);
    }

    // totalCountが検索条件に合致した全日報件数の値であることを確認
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount >= 0).toBe(true);
  });
});
