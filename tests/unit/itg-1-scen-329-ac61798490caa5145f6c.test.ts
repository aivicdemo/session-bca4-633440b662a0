import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import type {
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  validateUserAccountActiveStatus: jest.fn(),
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-329: 報告者名が1文字未満または100文字を超える場合、InvalidReporterNameFormatエラーを返す', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateReporterNameFormat = require('../../src/logic/input-validation-formatting.ts')
      .validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .detectDuplicateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = require('../../src/logic/user-master-persistence.ts')
      .validateUserAccountActiveStatus as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts')
      .registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts')
      .persistReporterMasterChangeHistory as jest.Mock;

    // validateReporterNameFormat: 空文字列または100文字超過の場合エラーを発火
    mockValidateReporterNameFormat.mockImplementation(
      (input: any) => {
        const name = input.reporterName;
        if (name === '' || name.length > 100) {
          throw new InvalidReporterNameFormat(
            '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
          );
        }
        return { isValid: true };
      }
    );

    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'RPT-001' });
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'CHG-001',
    });
  });

  it('テストケース1: 報告者名が空文字列の場合、InvalidReporterNameFormatエラーを返す', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '',
      emailAddress: 'test@example.com',
      teamLeaderId: 'leader-id',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );
    expect(result.changeHistoryId).toBe(null);

    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('テストケース2: 報告者名が100文字を超える場合、InvalidReporterNameFormatエラーを返す', async () => {
    const executionTimestamp = new Date();
    // 101文字の文字列を作成
    const longName =
      '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890a';

    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: longName,
      emailAddress: 'test@example.com',
      teamLeaderId: 'leader-id',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );
    expect(result.changeHistoryId).toBe(null);

    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
