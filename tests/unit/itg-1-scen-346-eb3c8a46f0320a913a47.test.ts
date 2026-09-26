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

describe('SCEN-346: 削除対象のメンバーが過去7日以内に日報を提出している場合、br-tx_7-002の制約3により「最近の日報があります。削除前に確認してください」警告が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: '削除対象メンバー名', errorCode: null });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true, validatedEmailAddress: 'delete.member@example.com', errorCode: null });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false, validatedEmailAddress: 'delete.member@example.com', errorCode: null });
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedRegisterReporterToMaster.mockResolvedValue({
      success: false,
      reporterId: null,
      message: '最近の日報があります。削除前に確認してください',
    });
  });

  it('削除対象のメンバーが過去7日以内に日報を提出している場合、警告メッセージが返される', async () => {
    const input = {
      userId: 'reporter-001',
      reporterName: '削除対象メンバー名',
      emailAddress: 'delete.member@example.com',
      teamLeaderId: 'teamleader-001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('最近の日報があります。削除前に確認してください');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
