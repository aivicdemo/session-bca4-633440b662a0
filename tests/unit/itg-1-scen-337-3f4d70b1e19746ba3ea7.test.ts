import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  UserNotFoundInUserMaster,
} from '../../src/logic/reporter-master-management';
import type {
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  validateUserAccountActiveStatus: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-337: ユーザーマスタが空の場合、br-tx_3-004の制約1により「対象者が登録されていません。ユーザーマスタを設定してください」エラーで処理が中断される', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateReporterNameFormat = require('../../src/logic/input-validation-formatting.ts')
      .validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .detectDuplicateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = require('../../src/logic/user-authentication-authorization.ts')
      .validateUserAccountActiveStatus as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts')
      .registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts')
      .persistReporterMasterChangeHistory as jest.Mock;

    // スタブ設定：各検証処理は正常系を返す
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });

    // ユーザーマスタが空の状態を再現：validateUserAccountActiveStatusが
    // br-tx_3-004制約1のメッセージで例外を発生させる
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockImplementation(() => {
      throw new UserNotFoundInUserMaster(
        '対象者が登録されていません。ユーザーマスタを設定してください'
      );
    });
  });

  it('ユーザーマスタが空の場合、br-tx_3-004の制約1により対象者が登録されていません。ユーザーマスタを設定してください エラーが返される', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      '対象者が登録されていません。ユーザーマスタを設定してください'
    );
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMasterおよびpersistReporterMasterChangeHistoryは呼び出されない
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
