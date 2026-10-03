import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));
jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserAccountActiveStatus: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

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

describe('SCEN-370: 実行者のユーザーIDが空の場合、br-tx_7-007の制約3により「実行者情報が取得できません」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('チームリーダーIDが空文字列の場合、エラーメッセージが返される', async () => {
    const input = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: '',
      executionTimestamp: new Date(),
    };

    // スタブの設定
    (mockedValidateReporterNameFormat as jest.Mock<any>).mockResolvedValue({ isValid: true });
    (mockedValidateEmailAddress as jest.Mock<any>).mockResolvedValue({ isValid: true });
    (mockedDetectDuplicateEmailAddress as jest.Mock<any>).mockResolvedValue({ isDuplicate: false });
    (mockedValidateUserAccountActiveStatus as jest.Mock<any>).mockResolvedValue({ isActive: true });

    // registerReporterToMasterが実行者情報が空の場合エラーを発生させる
    mockedRegisterReporterToMaster.mockImplementation(() => {
      throw new Error('実行者情報が取得できません');
    });

    // registerReporter関数を呼び出す
    const result = await registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();
  });
});
