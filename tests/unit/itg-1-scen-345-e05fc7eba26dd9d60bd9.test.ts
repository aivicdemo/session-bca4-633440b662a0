import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { registerReporter, RegisterReporterInput } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

const mockedValidateReporterNameFormat = jest.mocked(inputValidation.validateReporterNameFormat);
const mockedValidateEmailAddress = jest.mocked(inputValidation.validateEmailAddress);
const mockedDetectDuplicateEmailAddress = jest.mocked(inputValidation.detectDuplicateEmailAddress);
const mockedRegisterReporterToMaster = jest.mocked(userMasterPersistence.registerReporterToMaster);
const mockedPersistReporterMasterChangeHistory = jest.mocked(userMasterPersistence.persistReporterMasterChangeHistory);

describe('SCEN-345: 既に登録されているメンバーIDが重複して登録されようとする場合、br-tx_7-002の制約2により「このメンバーは既に登録されています」エラーで処理が中断される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: 'テスト太郎',
      errorCode: null
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'member1.new@company.com',
      errorCode: null
    });
  });

  it('should return error when memberEmail is already registered', async () => {
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: true,
      validatedEmailAddress: 'member1.new@company.com',
      errorCode: 'DUPLICATE_EMAIL'
    });

    const input: RegisterReporterInput = {
      userId: 'user-001',
      reporterName: 'テスト太郎',
      emailAddress: 'member1.new@company.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: now
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
