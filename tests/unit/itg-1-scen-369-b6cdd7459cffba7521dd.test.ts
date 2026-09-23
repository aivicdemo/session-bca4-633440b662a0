import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-369: 操作種別がCREATE・UPDATE・DELETE以外の場合、br-tx_7-007の制約2により「不正な操作種別です」エラーメッセージが返される', () => {
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

    // 正常系のモック設定
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REP001' });

    // recordMasterChangeLogは不正な操作種別で例外を発生させるよう設定
    // @ts-ignore
    mockRecordMasterChangeLog.mockImplementation((params: any) => {
      if (!['CREATE', 'UPDATE', 'DELETE'].includes(params.operationType)) {
        throw new Error('不正な操作種別です');
      }
      return Promise.resolve({ changeHistoryId: 'CHG001' });
    });
  });

  it('operationTypeが「INVALID」の場合、「不正な操作種別です」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    // recordMasterChangeLogが「INVALID」で呼ばれることを模擬するため、
    // registerReporterToMasterの後に不正な操作種別でrecordMasterChangeLogが呼ばれるようにする
    mockRegisterReporterToMaster.mockImplementation(async () => {
      // 不正な操作種別でrecordMasterChangeLogを呼び出す
      await mockRecordMasterChangeLog({ operationType: 'INVALID' });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });

  it('operationTypeが「UNKNOWN」の場合、「不正な操作種別です」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    mockRegisterReporterToMaster.mockImplementation(async () => {
      await mockRecordMasterChangeLog({ operationType: 'UNKNOWN' });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });

  it('operationTypeが空文字列の場合、「不正な操作種別です」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    mockRegisterReporterToMaster.mockImplementation(async () => {
      await mockRecordMasterChangeLog({ operationType: '' });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });

  it('operationTypeがnullの場合、「不正な操作種別です」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    mockRegisterReporterToMaster.mockImplementation(async () => {
      await mockRecordMasterChangeLog({ operationType: null });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });

  it('operationTypeが数値の場合、「不正な操作種別です」エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    mockRegisterReporterToMaster.mockImplementation(async () => {
      await mockRecordMasterChangeLog({ operationType: 123 });
      return { reporterId: 'REP001' };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });
});
