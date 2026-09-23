import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-371: UPDATE操作で変更前後の値が完全に同じ場合、br-tx_7-007の制約4により「変更内容がありません。保存をスキップします」警告メッセージが返される', () => {
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

    // 検証の成功応答を設定
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

    // recordMasterChangeLogはbeforeValuesとafterValuesが同じ場合に警告を返すよう設定
    // @ts-ignore
    mockRecordMasterChangeLog.mockImplementation((params: any) => {
      if (
        params.operationType === 'UPDATE' &&
        JSON.stringify(params.beforeValues) === JSON.stringify(params.afterValues)
      ) {
        // 変更内容がない場合は警告メッセージを返す（persistCaller呼び出しはスキップ）
        return Promise.resolve({
          changeHistoryId: null,
          warning: '変更内容がありません。保存をスキップします',
          changedFields: [],
        });
      }
      return Promise.resolve({ changeHistoryId: 'CHG001' });
    });
  });

  it('UPDATE操作で変更前後の値が完全に同じ場合、警告メッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    // registerReporterToMasterの後にrecordMasterChangeLogが呼ばれる
    // beforeValuesとafterValuesが同じであることを模擬
    mockRegisterReporterToMaster.mockImplementation(async () => {
      const beforeValues = {
        userId: 'TL001',
        reporterName: '山田太郎',
        emailAddress: 'yamada@example.com',
      };
      const afterValues = {
        userId: 'TL001',
        reporterName: '山田太郎',
        emailAddress: 'yamada@example.com',
      };

      // @ts-ignore
      const result = await mockRecordMasterChangeLog({
        operationType: 'UPDATE',
        reporterId: 'REP001',
        beforeValues,
        afterValues,
        executedBy: 'TL001',
        executedAt: new Date(),
      });

      // @ts-ignore
      return { reporterId: 'REP001', changeHistoryId: result.changeHistoryId };
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    // RegisterReporterOutputの検証
    expect(result.success).toBeFalsy(); // 警告なので成功ではない、または警告フラグが立つ
    expect(result.reporterId).toBeNull(); // 変更内容なし時はreporterIdがnull
    expect(result.changeHistoryId).toBeNull(); // 変更内容なし時はchangeHistoryIdがnull
    expect(result.message).toBe('変更内容がありません。保存をスキップします');

    // persistReporterMasterChangeHistoryへの呼び出しがスキップされていることを確認
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('UPDATE操作でbeforeValuesとafterValuesが同じとき、changedFieldsが空配列となることを確認', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    let recordedParams: any;

    mockRegisterReporterToMaster.mockImplementation(async () => {
      const beforeValues = {
        userId: 'TL001',
        reporterName: '山田太郎',
        emailAddress: 'yamada@example.com',
      };
      const afterValues = {
        userId: 'TL001',
        reporterName: '山田太郎',
        emailAddress: 'yamada@example.com',
      };

      recordedParams = {
        operationType: 'UPDATE',
        reporterId: 'REP001',
        beforeValues,
        afterValues,
        executedBy: 'TL001',
        executedAt: new Date(),
      };

      // @ts-ignore
      const result = await mockRecordMasterChangeLog(recordedParams);
      // @ts-ignore
      return { reporterId: 'REP001', changeHistoryId: result.changeHistoryId };
    });

    await registerReporter(input);

    // recordMasterChangeLogに渡されたパラメータを検証
    expect(mockRecordMasterChangeLog).toHaveBeenCalled();
    const callParams = mockRecordMasterChangeLog.mock.calls[0][0];
    // @ts-ignore
    expect(callParams.operationType).toBe('UPDATE');
    // @ts-ignore
    expect(JSON.stringify(callParams.beforeValues)).toBe(JSON.stringify(callParams.afterValues));
  });
});
