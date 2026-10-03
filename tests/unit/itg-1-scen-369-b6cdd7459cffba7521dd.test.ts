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

import { registerReporter, InvalidOperationType } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-369: 操作種別がCREATE・UPDATE・DELETE以外の場合、br-tx_7-007の制約2により「不正な操作種別です」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('不正な操作種別の場合、エラーメッセージが返される', async () => {
    const input = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    // スタブの設定
    (mockedValidateReporterNameFormat as jest.Mock<any>).mockResolvedValue({ isValid: true });
    (mockedValidateEmailAddress as jest.Mock<any>).mockResolvedValue({ isValid: true });
    (mockedDetectDuplicateEmailAddress as jest.Mock<any>).mockResolvedValue({ isDuplicate: false });
    (mockedRegisterReporterToMaster as jest.Mock<any>).mockResolvedValue({ reporterId: 'REP001' });

    // persistReporterMasterChangeHistoryが不正な操作種別でエラーを発生させる
    mockedPersistReporterMasterChangeHistory.mockImplementation(() => {
      throw new InvalidOperationType('不正な操作種別です');
    });

    // registerReporter関数を呼び出す
    const result = await registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });
});
