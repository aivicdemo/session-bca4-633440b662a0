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

describe('SCEN-341: 異動で既存報告者IDが存在する場合、br-tx_7-002により更新操作が決定される', () => {
  const userId = 'R001';
  const reporterName = '異動後太郎';
  const emailAddress = 'moved@example.com';
  const teamLeaderId = 'TL001';
  const executionTimestamp = new Date();

  beforeEach(() => {
    jest.resetAllMocks();

    (mockedValidateReporterNameFormat as jest.Mock<any>).mockResolvedValue({ isValid: true });
    (mockedValidateEmailAddress as jest.Mock<any>).mockResolvedValue({ isValid: true });
    (mockedDetectDuplicateEmailAddress as jest.Mock<any>).mockResolvedValue({ isDuplicate: false });
    (mockedValidateUserAccountActiveStatus as jest.Mock<any>).mockResolvedValue(true);
    (mockedRegisterReporterToMaster as jest.Mock<any>).mockResolvedValue({ success: true, reporterId: 'R001', message: '' });
    (mockedPersistReporterMasterChangeHistory as jest.Mock<any>).mockResolvedValue({ success: true, changeHistoryId: 'CHG-001', message: '' });
  });

  it('異動で既存reporterIdが存在する場合、更新操作が決定され、success=true、reporterId=R001、changeHistoryId=CHG-001を返す', async () => {
    const input = {
      userId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toContain('更新');
    expect(result.changeHistoryId).toBe('CHG-001');
    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
