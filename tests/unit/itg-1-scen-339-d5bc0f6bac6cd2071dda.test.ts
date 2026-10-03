import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserAccountActiveStatus: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
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

describe('SCEN-339: 複数ユーザーのうち、アクティブなユーザーのみ認識される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーマスタの複数ユーザーからアクティブなユーザーのみが認識される', async () => {
    const now = new Date('2024-01-15T10:00:00Z');

    // U001, U002, U004 がアクティブ、U003, U005 は非アクティブ
    // U001 を選んで registerReporter を呼び出し
    const input = {
      userId: 'U001',
      reporterName: 'Active User 1',
      emailAddress: 'user1@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now,
    };

    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: 'Active User 1',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'user1@example.com',
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'user1@example.com',
      errorCode: null,
    });

    // U001 はアクティブ
    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId: 'U001',
    });

    mockedRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterId: 'REPORTER-U001',
      message: 'Success',
    });

    mockedPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'HISTORY-001',
      message: 'Recorded',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER-U001');
    expect(mockedValidateUserAccountActiveStatus).toHaveBeenCalledWith({ userId: 'U001' });
  });

  it('非アクティブユーザーは登録できない', async () => {
    const now = new Date('2024-01-15T10:00:00Z');

    // U003 は非アクティブ
    const input = {
      userId: 'U003',
      reporterName: 'Inactive User',
      emailAddress: 'user3@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now,
    };

    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: 'Inactive User',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'user3@example.com',
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'user3@example.com',
      errorCode: null,
    });

    // U003 は非アクティブ
    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: false,
      userId: 'U003',
      inactiveReason: 'User is inactive',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
  });
});
