import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
  InvalidReporterNameFormatError,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-376: 更新された報告者名が空文字列または許可された文字種を超えると、InvalidReporterNameFormatErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('報告者名が空文字列の場合、エラー処理が行われる', () => {
    const reporterId = 'reporter-001';
    const teamLeaderId = 'leader-001';
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    (validateReporterNameFormat as jest.Mock).mockImplementation(() => {
      throw new InvalidReporterNameFormatError('報告者名の形式が正しくありません。');
    });

    const input: UpdateReporterInput = {
      reporterId,
      reporterName: '',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId,
      executionTimestamp,
    };

    try {
      const result: UpdateReporterOutput = updateReporter(input);
      // エラーハンドリング出力が返される場合
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.changeHistoryId).toBeNull();
      expect(result.message).toContain('報告者名の形式が正しくありません。');
    } catch (error) {
      // 例外をスローする場合
      expect(error).toBeInstanceOf(InvalidReporterNameFormatError);
      expect((error as Error).message).toContain('報告者名の形式が正しくありません。');
    }
  });
});
