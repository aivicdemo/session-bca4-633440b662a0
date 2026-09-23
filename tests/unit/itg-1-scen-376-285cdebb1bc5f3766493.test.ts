import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { updateReporter } from '../../src/logic/reporter-master-management';
import * as validation from '../../src/logic/input-validation-formatting';
import { InvalidReporterNameFormatError } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-376: InvalidReporterNameFormatError when name is empty or invalid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error output when reporter name is empty string', async () => {
    // validateReporterNameFormat をスタブ化して InvalidReporterNameFormatError を発生させる
    (validation.validateReporterNameFormat as any).mockRejectedValue(
      new InvalidReporterNameFormatError('報告者名の形式が正しくありません。')
    );

    const input = {
      reporterId: 'reporter-001',
      reporterName: '',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    // InvalidReporterNameFormatError が発生することを期待
    await expect(updateReporter(input)).rejects.toThrow(InvalidReporterNameFormatError);

    // エラーメッセージを確認
    try {
      await updateReporter(input);
    } catch (error) {
      if (error instanceof InvalidReporterNameFormatError) {
        expect(error.message).toBe('報告者名の形式が正しくありません。');
      }
    }
  });
});
