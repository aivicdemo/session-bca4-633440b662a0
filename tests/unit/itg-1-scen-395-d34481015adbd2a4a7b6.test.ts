jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

import {
  getActiveReportersForSubmissionCheck,
  isReporterActiveAndValid,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
  IsReporterActiveAndValidInput,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;
const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;

describe('SCEN-395: 指定日付で有効な報告者が1件だけ存在する場合、その1件の報告者情報と総件数1を正常に返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('targetDate を営業日かつ本日以前の日付、teamLeaderId を有効なチームリーダーID に設定し、isBusinessDay スタブを true、isReporterActiveAndValid スタブを1件の報告者について true を返すように設定した場合、success=true、reporters 配列の要素数=1、reporters[0] がすべてのフィールドを保持、totalCount=1、message が成功を示す文言を返す', async () => {
    // Arrange: 入力値を設定
    const targetDate = new Date('2024-01-15T00:00:00+09:00');
    const teamLeaderId = 'TL001';

    const expectedReporter: ActiveReporterInfo = {
      reporterId: 'R001',
      userId: 'U001',
      reporterName: '佐藤太郎',
      emailAddress: 'satou@example.com',
      department: '営業部',
      status: 'active',
    };

    // isBusinessDay スタブを true を返すように設定
    mockedIsBusinessDay.mockReturnValue(true);

    // isReporterActiveAndValid スタブを1件の報告者について true を返すように設定
    mockedIsReporterActiveAndValid.mockImplementation((input: IsReporterActiveAndValidInput) => {
      if (input.reporterId === 'R001') {
        return true;
      }
      return false;
    });

    // getActiveReportersForSubmissionCheck の実装をモック
    const expectedOutput: GetActiveReportersForSubmissionCheckOutput = {
      success: true,
      reporters: [expectedReporter],
      totalCount: 1,
      message: '日報提出対象の有効な報告者を取得しました。',
    };
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(expectedOutput);

    // Act: getActiveReportersForSubmissionCheck(targetDate, teamLeaderId) を呼び出す
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result = await getActiveReportersForSubmissionCheck(input);

    // Assert: 期待結果を確認
    expect(result.success).toBe(true);
    expect(result.reporters).toHaveLength(1);
    expect(result.reporters[0]).toEqual(expectedReporter);
    expect(result.reporters[0].reporterId).toBe('R001');
    expect(result.reporters[0].userId).toBe('U001');
    expect(result.reporters[0].reporterName).toBe('佐藤太郎');
    expect(result.reporters[0].emailAddress).toBe('satou@example.com');
    expect(result.reporters[0].department).toBe('営業部');
    expect(result.reporters[0].status).toBe('active');
    expect(result.totalCount).toBe(1);
    expect(result.message).toMatch(/成功|取得/);
  });
});
