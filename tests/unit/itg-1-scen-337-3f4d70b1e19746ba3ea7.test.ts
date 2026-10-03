import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

import { registerReporter } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;

describe('SCEN-337: ユーザーマスタが空の場合、br-tx_3-004の制約1により制約1エラーが返される', () => {
  const now = new Date('2024-01-15T10:00:00Z');
  const input = {
    userId: 'U001',
    reporterName: '山田太郎',
    emailAddress: 'yamada@example.com',
    teamLeaderId: 'TL001',
    executionTimestamp: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーマスタが空の状態の場合、制約1のエラーメッセージで処理が中断される', async () => {
    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId: 'U001',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('対象者が登録されていません。ユーザーマスタを設定してください');
    expect(result.changeHistoryId).toBeNull();
  });
});
