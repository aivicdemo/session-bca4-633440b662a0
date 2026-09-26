import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateUserInformationRequired: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

import {
  registerReporterToMaster,
  type RegisterReporterToMasterInput,
  type RegisterReporterToMasterOutput,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';
import { validateUserInformationRequired, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

const mockedValidateUserInformationRequired = validateUserInformationRequired as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-453: 必須項目と形式が正常な報告者情報を受け取り、マスタへ登録して登録完了結果を返す', () => {
  const reporterName = '山田太郎';
  const emailAddress = 'yamada.taro@company.com';
  const department = '営業部';
  const leaderUserId = 'leader001';
  const registrationTimestamp = new Date('2024-01-15T10:00:00+09:00');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      validatedUserName: reporterName,
      validatedEmailAddress: emailAddress,
      validatedDepartment: department,
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: emailAddress,
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: emailAddress,
      errorCode: null,
    });

    mockedPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'CH-001',
      message: '履歴記録完了',
    });
  });

  it('有効な報告者情報を受け取り、マスタへ登録して登録完了結果を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName,
      emailAddress,
      department,
      leaderUserId,
      registrationTimestamp,
    };

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).not.toBeNull();
    expect(result.reporterId).toMatch(/^reporter_[a-f0-9\-]{36}$/);
    expect(result.message).toBe('報告者を登録しました。');

    expect(mockedValidateUserInformationRequired).toHaveBeenCalledWith({
      userName: reporterName,
      emailAddress,
      department,
    });
    expect(mockedValidateEmailAddress).toHaveBeenCalledWith({ emailAddress });
    expect(mockedDetectDuplicateEmailAddress).toHaveBeenCalledWith({
      emailAddress,
      existingUserEmails: expect.any(Array),
    });
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();

    const persistCall = mockedPersistReporterMasterChangeHistory.mock.calls[0][0];
    expect(persistCall.operationType).toBe('register');
    expect(persistCall.leaderUserId).toBe(leaderUserId);
    expect(persistCall.operationTimestamp).toEqual(registrationTimestamp);
  });
});
