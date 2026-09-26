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

describe('SCEN-343: 休職のメンバーの場合、br-tx_7-002により更新操作が決定される', () => {
  const userId = 'user-on-leave-001';
  const reporterName = '山田太郎';
  const emailAddress = 'yamada@example.com';
  const teamLeaderId = 'leader-001';
  const executionTimestamp = new Date();

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: reporterName, errorCode: null });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true, validatedEmailAddress: emailAddress, errorCode: null });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false, validatedEmailAddress: emailAddress, errorCode: null });
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: '',
    });
    mockedPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'history-20250115-001',
      message: '',
    });
  });

  it('休職メンバーの場合、更新操作が決定され、success=true、reporterId=reporter-001、changeHistoryId=history-20250115-001を返す', async () => {
    const input = {
      userId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.message).toContain('更新');
    expect(result.changeHistoryId).toBe('history-20250115-001');
    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
