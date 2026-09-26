import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

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

describe('SCEN-344: メンバーの変更内容が不明確な場合、br-tx_7-002の制約1により「変更内容を確認してください」警告が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: '田中太郎', errorCode: null });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true, validatedEmailAddress: 'tanaka@example.com', errorCode: null });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false, validatedEmailAddress: 'tanaka@example.com', errorCode: null });
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
  });

  it('memberChangeTypeが不明確な値（空文字列）の場合、警告メッセージが返される', async () => {
    const input = {
      userId: 'user-001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toContain('変更内容を確認してください');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('memberChangeTypeが不定義の値「その他」の場合、警告メッセージが返される', async () => {
    const input = {
      userId: 'user-001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toContain('確認');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
  });
});
