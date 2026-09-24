import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

describe('SCEN-329: 報告者名が1文字未満または100文字を超える場合、InvalidReporterNameFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return InvalidReporterNameFormat error when reporter name is empty string (test case 1)', async () => {
    // スタブ: validateReporterNameFormat を準備
    jest
      .spyOn(inputValidation, 'validateReporterNameFormat')
      .mockImplementation(() => {
        throw new InvalidReporterNameFormat(
          '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
        );
      });

    jest
      .spyOn(inputValidation, 'validateEmailAddress')
      .mockResolvedValue({ isValid: true });

    jest
      .spyOn(inputValidation, 'detectDuplicateEmailAddress')
      .mockResolvedValue({ isDuplicate: false });

    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '',
      emailAddress: 'test@example.com',
      teamLeaderId: 'leader-id',
      executionTimestamp: now,
    };

    // registerReporter を呼び出す
    const result = (await registerReporter(input)) as RegisterReporterOutput;

    // テストケース1の出力検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster および persistReporterMasterChangeHistory は呼び出されないことを確認
    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('should return InvalidReporterNameFormat error when reporter name exceeds 100 characters (test case 2)', async () => {
    // スタブ: validateReporterNameFormat を準備し、報告者名が100文字を超える場合は InvalidReporterNameFormat エラーを返す
    jest
      .spyOn(inputValidation, 'validateReporterNameFormat')
      .mockImplementation(() => {
        throw new InvalidReporterNameFormat(
          '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
        );
      });

    jest
      .spyOn(inputValidation, 'validateEmailAddress')
      .mockResolvedValue({ isValid: true });

    jest
      .spyOn(inputValidation, 'detectDuplicateEmailAddress')
      .mockResolvedValue({ isDuplicate: false });

    const now = new Date();
    const longName = '1234567890'.repeat(11); // 110文字
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: longName,
      emailAddress: 'test@example.com',
      teamLeaderId: 'leader-id',
      executionTimestamp: now,
    };

    // registerReporter を呼び出す
    const result = (await registerReporter(input)) as RegisterReporterOutput;

    // テストケース2の出力検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster および persistReporterMasterChangeHistory は呼び出されないことを確認
    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
