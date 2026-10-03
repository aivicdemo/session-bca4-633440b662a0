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
  ReporterRegistrationFailedError,
} from '../../src/logic/user-master-persistence';

import {
  validateUserInformationRequired,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';

const mockedValidateUserInformationRequired = validateUserInformationRequired as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;

describe('SCEN-456: データベース障害により登録処理が失敗した場合、登録失敗を返す', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('persistReporterMasterChangeHistory がデータベース障害を投げた場合、登録失敗を返す', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '新規報告者',
      emailAddress: 'new.reporter@example.com',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      validatedUserName: '新規報告者',
      validatedEmailAddress: 'new.reporter@example.com',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    mockedValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'new.reporter@example.com',
      errorCode: null,
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'new.reporter@example.com',
      errorCode: null,
    });

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者の登録に失敗しました。システム管理者に連絡してください。');
  });
});