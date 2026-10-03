import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>(
    '../../src/logic/input-validation-formatting'
  ),
  validateUserInformationRequired: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

import {
  registerReporterToMaster,
  type RegisterReporterToMasterInput,
  type RegisterReporterToMasterOutput,
  DuplicateReporterEmailError,
} from '../../src/logic/user-master-persistence';

import {
  validateUserInformationRequired,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';

const mockedValidateUserInformationRequired = validateUserInformationRequired as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;

describe('SCEN-455: 入力されたメールアドレスが既にマスタに登録されている場合、登録失敗を返す', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('メールアドレスが既に登録されている場合、DuplicateReporterEmailError を発生させる', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'yamada.taro@company.jp',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada.taro@company.jp',
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: true,
      validatedEmailAddress: 'yamada.taro@company.jp',
      errorCode: 'DuplicateEmailError',
    });

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      validatedUserName: '山田太郎',
      validatedEmailAddress: 'yamada.taro@company.jp',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    const result: RegisterReporterToMasterOutput | { success: false; reporterId: null; message: string } = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。');
  });
});
