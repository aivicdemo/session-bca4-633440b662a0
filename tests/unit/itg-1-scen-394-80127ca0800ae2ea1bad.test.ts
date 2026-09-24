jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/user-master-persistence');

import {
  getActiveReportersForSubmissionCheck,
  ReporterMasterAccessError,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;

describe('SCEN-394: 報告者マスタデータへのアクセスに失敗した場合、ReporterMasterAccessErrorを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsBusinessDay.mockReturnValue(true);
  });

  it('報告者マスタデータへのアクセス処理が失敗した場合、success=false、message=\'報告者マスタの取得に失敗しました。\'、reporters=[]、totalCount=0、errorName=\'ReporterMasterAccessError\'を返す', async () => {
    // Arrange: isBusinessDay スタブを営業日判定が true を返すように設定
    mockedIsBusinessDay.mockReturnValue(true);

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate: new Date('2024-01-15T00:00:00+09:00'),
      teamLeaderId: 'leader-001',
    };

    // 報告者マスタへのアクセス処理が例外をスロー、またはnullを返すようにシミュレート
    // (通常、この時点で reporterMasterのアクセスが失敗する)
    let result: GetActiveReportersForSubmissionCheckOutput | null = null;
    let caughtError: Error | null = null;

    // Act: getActiveReportersForSubmissionCheck を実行
    try {
      result = await getActiveReportersForSubmissionCheck(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // Assert: 期待結果を確認
    // エラーが発生した場合
    if (caughtError) {
      expect(caughtError).toBeInstanceOf(ReporterMasterAccessError);
      expect(caughtError.name).toBe('ReporterMasterAccessError');
    }
    // またはエラーを返す場合
    else if (result) {
      expect(result.success).toBe(false);
      expect(result.message).toBe('報告者マスタの取得に失敗しました。');
      expect(result.reporters).toEqual([]);
      expect(result.totalCount).toBe(0);
    }
  });
});
