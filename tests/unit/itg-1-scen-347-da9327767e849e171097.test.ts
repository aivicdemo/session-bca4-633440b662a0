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

describe('SCEN-347: 報告者名が入力され、メールアドレスが入力され、メールアドレス形式が正しく、重複がない場合、br-tx_7-003により有効判定で返される', () => {
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: '山田太郎', errorCode: null });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true, validatedEmailAddress: 'yamada@example.com', errorCode: null });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false, validatedEmailAddress: 'yamada@example.com', errorCode: null });
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedRegisterReporterToMaster.mockResolvedValue({ success: true, reporterId: 'REPORTER001', message: '' });
    mockedPersistReporterMasterChangeHistory.mockResolvedValue({ success: true, changeHistoryId: 'HISTORY001', message: '' });
  });

  it('報告者名、メールアドレスが入力され、形式が正しく、重複がない場合、RegisterReporterOutput が成功で返される', async () => {
    const input = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER001');
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe('string');
    expect(result.changeHistoryId).toBe('HISTORY001');
    expect(mockedValidateReporterNameFormat).toHaveBeenCalled();
    expect(mockedValidateEmailAddress).toHaveBeenCalled();
    expect(mockedDetectDuplicateEmailAddress).toHaveBeenCalled();
    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
