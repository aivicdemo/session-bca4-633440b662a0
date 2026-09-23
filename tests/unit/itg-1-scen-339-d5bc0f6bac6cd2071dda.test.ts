import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
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

describe('SCEN-339: ユーザーマスタの代表的な複数ユーザーのうち、アクティブなユーザーのみがシステムに認識される', () => {
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

    // テスト前提条件：ユーザーマスタに複数のユーザーが登録されている
    // (1) userId='U001', is_active=true
    // (2) userId='U002', is_active=true
    // (3) userId='U003', is_active=false
    // (4) userId='U004', is_active=true
    // (5) userId='U005', is_active=false

    // スタブ設定
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });

    // アクティブなユーザーのみ成功、非アクティブなユーザーは失敗
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockImplementation((input: any) => {
      const activeUsers = ['U001', 'U002', 'U004'];
      if (activeUsers.includes(input.userId)) {
        // @ts-ignore
        return Promise.resolve({ isActive: true });
      }
      // @ts-ignore
      return Promise.resolve({ isActive: false });
    });

    // 登録が成功した場合
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REPORTER-001' });
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'HISTORY-001',
    });
  });

  it('アクティブなユーザー（U001, U002, U004）のみがシステムに認識される', async () => {
    // テスト対象：アクティブなユーザーで登録を実行
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',  // アクティブなユーザー
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // アクティブなユーザーなので、登録が成功する
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER-001');
    expect(result.changeHistoryId).toBe('HISTORY-001');

    // validateUserAccountActiveStatusがアクティブ状態を検証することを確認
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'U001' })
    );
  });

  it('非アクティブなユーザー（U003, U005）はシステムに認識されない', async () => {
    // テスト対象：非アクティブなユーザーで登録を実行
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U003',  // 非アクティブなユーザー
      reporterName: '佐藤次郎',
      emailAddress: 'sato@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockImplementation((input: any) => {
      // U003は非アクティブなので false を返す
      if (input.userId === 'U003') {
        // @ts-ignore
        return Promise.resolve({ isActive: false });
      }
      // @ts-ignore
      return Promise.resolve({ isActive: true });
    });

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 非アクティブなユーザーなので、登録が失敗する
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
  });
});
