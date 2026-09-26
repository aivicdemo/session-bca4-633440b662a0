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

describe('SCEN-342: 退職または他部門異動の場合、br-tx_7-002により削除操作が決定される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
  });

  it('退職の場合、削除操作が決定され、registerReporterは呼び出されない', async () => {
    const input = {
      userId: 'R001',
      reporterName: '退職者太郎',
      emailAddress: 'retired@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
  });

  it('他部門異動の場合、削除操作が決定され、registerReporterは呼び出されない', async () => {
    const input = {
      userId: 'R002',
      reporterName: '異動者太郎',
      emailAddress: 'moved-dept@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
  });
});
