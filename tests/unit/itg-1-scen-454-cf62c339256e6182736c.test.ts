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
  InvalidReporterInformationError,
} from '../../src/logic/user-master-persistence';

import {
  validateUserInformationRequired,
  validateEmailAddress,
} from '../../src/logic/input-validation-formatting';

const mockedValidateUserInformationRequired = validateUserInformationRequired as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;

describe('SCEN-454: 報告者情報が必須項目を満たさないまたはメールアドレス形式が不正な場合、登録失敗を返す', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('テストケース1: reporterName が空文字列の場合、登録失敗を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '',
      emailAddress: 'reporter@example.com',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: false,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: 'EmptyReporterNameError',
    });

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('テストケース2: emailAddress が null/undefined の場合、登録失敗を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: null as any,
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: false,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: 'EmptyEmailAddressError',
    });

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('テストケース3: department が空文字列の場合、登録失敗を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'reporter@example.com',
      department: '',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: false,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: 'EmptyDepartmentError',
    });

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('テストケース4: メールアドレス形式が不正（@ 記号がない）の場合、登録失敗を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'reporterexample.com',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      validatedUserName: '山田太郎',
      validatedEmailAddress: 'reporterexample.com',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'InvalidEmailFormatError',
    });

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('テストケース5: メールアドレス形式が不正（ドメイン部がない）の場合、登録失敗を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'reporter@',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      validatedUserName: '山田太郎',
      validatedEmailAddress: 'reporter@',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'InvalidEmailFormatError',
    });

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('テストケース6: 複数の必須項目が不足している場合、登録失敗を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '',
      emailAddress: '',
      department: '',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: false,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: 'MultipleRequiredFieldsError',
      errorDetails: [
        { field: 'reporterName', errorCode: 'EmptyReporterNameError' },
        { field: 'emailAddress', errorCode: 'EmptyEmailAddressError' },
        { field: 'department', errorCode: 'EmptyDepartmentError' },
      ],
    });

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });
});
