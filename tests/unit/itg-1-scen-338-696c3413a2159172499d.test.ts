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
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-338: 全ユーザーが非アクティブの場合、br-tx_3-004の制約2により警告が返される', () => {
  const now = new Date('2024-01-15T10:00:00Z');
  const input = {
    userId: 'user-001',
    reporterName: '山田太郎',
    emailAddress: 'yamada@example.com',
    teamLeaderId: 'leader-001',
    executionTimestamp: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全ユーザーが非アクティブ状態の場合、制約2の警告メッセージで処理が中断される', async () => {
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
      isActive: false,
      userId: 'user-001',
      inactiveReason: 'All users are inactive',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('アクティブなユーザーがいません。ユーザーマスタを確認してください');
    expect(result.changeHistoryId).toBeNull();

    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
