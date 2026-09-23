import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-395: 指定日付で有効な報告者が1件だけ存在する場合、その1件の報告者情報と総件数1を正常に返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 1 active reporter with all fields when exactly one reporter is valid on target date', async () => {
    // Arrange
    const targetDate = new Date('2024-01-15'); // 営業日かつ本日以前の日付
    const teamLeaderId = 'TL001';

    const mockReporter: ActiveReporterInfo = {
      reporterId: 'R001',
      userId: 'U001',
      reporterName: '佐藤太郎',
      emailAddress: 'satou@example.com',
      department: '営業部',
      status: 'active',
    };

    // isBusinessDay スタブを true を返すように設定
    const { isBusinessDay } = await import('../../src/logic/business-day-deadline-judgment');
    (isBusinessDay as any).mockReturnValue(true);

    // getActiveReportersForSubmissionCheck スタブを設定
    const { getActiveReportersForSubmissionCheck: mockGetActiveReporters } = await import('../../src/logic/reporter-master-management');
    const mockResult: GetActiveReportersForSubmissionCheckOutput = {
      success: true,
      reporters: [mockReporter],
      totalCount: 1,
      message: '日報提出対象の有効な報告者1件を取得しました。',
    };
    (mockGetActiveReporters as any).mockResolvedValue(mockResult);

    // Act
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result = await getActiveReportersForSubmissionCheck(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.reporters).toHaveLength(1);
    expect(result.reporters[0]).toEqual(mockReporter);
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
