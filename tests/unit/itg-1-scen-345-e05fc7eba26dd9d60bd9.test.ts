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

describe('SCEN-345: 既に登録されているメンバーIDが重複して登録されようとする場合、br-tx_7-002の制約2により「このメンバーは既に登録されています」エラーで処理が中断される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: 'テスト太郎', errorCode: null });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true, validatedEmailAddress: 'member1.new@company.com', errorCode: null });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: true, validatedEmailAddress: 'member1.new@company.com', errorCode: null });
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
  });

  it('既に登録されているメンバーIDが重複した場合、エラーメッセージ「このメンバーは既に登録されています」が返される', async () => {
    const input = {
      userId: 'user-001',
      reporterName: 'テスト太郎',
      emailAddress: 'member1.new@company.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメンバーは既に登録されています');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
