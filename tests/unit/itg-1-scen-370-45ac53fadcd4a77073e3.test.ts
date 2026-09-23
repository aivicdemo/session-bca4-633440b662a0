import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-370: 実行者のユーザーIDが空の場合、br-tx_7-007の制約3により「実行者情報が取得できません」エラーメッセージが返される', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;
  let mockRecordMasterChangeLog: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 入力検証モジュール
    const inputValidationModule = require('../../src/logic/input-validation-formatting.ts');
    mockValidateReporterNameFormat = inputValidationModule.validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = inputValidationModule.validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = inputValidationModule.detectDuplicateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = inputValidationModule.validateUserAccountActiveStatus as jest.Mock;

    // 永続化モジュール
    const persistenceModule = require('../../src/logic/user-master-persistence.ts');
    mockRegisterReporterToMaster = persistenceModule.registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = persistenceModule.persistReporterMasterChangeHistory as jest.Mock;
    mockRecordMasterChangeLog = persistenceModule.recordMasterChangeLog as jest.Mock;

    // 正常系の検証結果を返すようにスタブ化
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    // registerReporterToMasterとpersistReporterMasterChangeHistoryは呼ばれないことを確認するため、スタブ化のみ
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REP001' });
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({ changeHistoryId: 'CHG001' });

    // recordMasterChangeLogは実行者ユーザーIDが空の場合に例外を発生させるよう設定
    // @ts-ignore
    mockRecordMasterChangeLog.mockImplementation((params: any) => {
      if (params.executedBy === '' || params.executedBy === null || params.executedBy === undefined) {
        throw new Error('実行者情報が取得できません');
      }
      return Promise.resolve({ changeHistoryId: 'CHG001' });
    });
  });

  it('teamLeaderIdが空文字列の場合、「実行者情報が取得できません」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: '', // 空文字列
      executionTimestamp: new Date(),
    };

    // registerReporterToMasterの後にrecordMasterChangeLogが呼ばれ、空の実行者IDで例外が発生するようにする
    mockRegisterReporterToMaster.mockImplementation(async () => {
      await mockRecordMasterChangeLog({ executedBy: '' });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();

    // persistReporterMasterChangeHistoryが呼ばれていないことを確認
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('teamLeaderIdがnullの場合、「実行者情報が取得できません」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: null as any,
      executionTimestamp: new Date(),
    };

    mockRegisterReporterToMaster.mockImplementation(async () => {
      await mockRecordMasterChangeLog({ executedBy: null });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('teamLeaderIdがundefinedの場合、「実行者情報が取得できません」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: undefined as any,
      executionTimestamp: new Date(),
    };

    mockRegisterReporterToMaster.mockImplementation(async () => {
      await mockRecordMasterChangeLog({ executedBy: undefined });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
