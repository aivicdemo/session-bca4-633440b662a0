import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-372: チームリーダーが既存報告者の名前を更新すると、変更履歴が記録されて成功する', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockRetrieveReporterByUserId: jest.Mock;
  let mockUpdateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 入力検証モジュール
    const inputValidationModule = require('../../src/logic/input-validation-formatting.ts');
    mockValidateReporterNameFormat = inputValidationModule.validateReporterNameFormat as jest.Mock;

    // 永続化モジュール
    const persistenceModule = require('../../src/logic/user-master-persistence.ts');
    mockRetrieveReporterByUserId = persistenceModule.retrieveReporterByUserId as jest.Mock;
    mockUpdateReporterInMaster = persistenceModule.updateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = persistenceModule.persistReporterMasterChangeHistory as jest.Mock;

    // validateReporterNameFormatスタブを、入力「田中花子」に対して検証成功を返すよう設定
    // @ts-ignore
    mockValidateReporterNameFormat.mockImplementation((name: string) => {
      if (name === '田中花子') {
        return Promise.resolve({ isValid: true });
      }
      return Promise.resolve({ isValid: false });
    });

    // retrieveReporterByUserIdスタブを、teamLeaderId「TL001」で呼び出された場合にチーム内の報告者リスト（RPT001を含む）を返すよう設定
    // @ts-ignore
    mockRetrieveReporterByUserId.mockImplementation((teamLeaderId: string) => {
      if (teamLeaderId === 'TL001') {
        return Promise.resolve([
          {
            reporterId: 'RPT001',
            reporterName: '田中太郎',
            emailAddress: 'tanaka@example.com',
            department: '営業部',
            status: 'active',
            userId: 'TL001',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    // updateReporterInMasterスタブを、reporterId「RPT001」と新しい名前「田中花子」で呼び出された場合に成功を返すよう設定
    // @ts-ignore
    mockUpdateReporterInMaster.mockImplementation(
      (reporterId: string, updateData: any) => {
        if (reporterId === 'RPT001' && updateData.reporterName === '田中花子') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      }
    );

    // persistReporterMasterChangeHistoryスタブを、reporterId「RPT001」、変更前値「田中太郎」、変更後値「田中花子」で呼び出された場合に新しい変更履歴ID「CHG20250115001」を返すよう設定
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockImplementation(
      (params: any) => {
        if (
          params.reporterId === 'RPT001' &&
          params.beforeValues.reporterName === '田中太郎' &&
          params.afterValues.reporterName === '田中花子'
        ) {
          return Promise.resolve({ changeHistoryId: 'CHG20250115001' });
        }
        return Promise.resolve({ changeHistoryId: null });
      }
    );
  });

  it('チームリーダーが既存報告者の名前を更新すると、変更履歴が記録されて成功する', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '田中花子', // 更新対象
      emailAddress: null, // 現在値保持
      department: null, // 現在値保持
      status: null, // 現在値保持
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result: UpdateReporterOutput = await updateReporter(input);

    // 出力型UpdateReporterOutputの各フィールドを検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT001');
    expect(result.message).toBeDefined();
    expect(result.message).toContain('正常に更新');
    expect(result.changeHistoryId).toBe('CHG20250115001');
  });

  it('validateReporterNameFormatスタブが入力「田中花子」に対して検証成功を返すことを確認', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '田中花子',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    await updateReporter(input);

    expect(mockValidateReporterNameFormat).toHaveBeenCalledWith('田中花子');
  });

  it('retrieveReporterByUserIdスタブがチームリーダー「TL001」で呼び出された場合に報告者リストを返すことを確認', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '田中花子',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    await updateReporter(input);

    expect(mockRetrieveReporterByUserId).toHaveBeenCalledWith('TL001');
  });

  it('updateReporterInMasterスタブがreporterId「RPT001」と新しい名前「田中花子」で呼び出されることを確認', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '田中花子',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    await updateReporter(input);

    expect(mockUpdateReporterInMaster).toHaveBeenCalledWith(
      'RPT001',
      expect.objectContaining({
        reporterName: '田中花子',
      })
    );
  });

  it('persistReporterMasterChangeHistoryスタブが正しいパラメータで呼び出されることを確認', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '田中花子',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const executedAt = new Date();
    const inputWithTimestamp: UpdateReporterInput = {
      ...input,
      executionTimestamp: executedAt,
    };

    await updateReporter(inputWithTimestamp);

    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'RPT001',
        beforeValues: expect.objectContaining({
          reporterName: '田中太郎',
        }),
        afterValues: expect.objectContaining({
          reporterName: '田中花子',
        }),
        changedFields: expect.arrayContaining(['reporterName']),
        teamLeaderId: 'TL001',
      })
    );
  });

  it('changeHistoryIdが「CHG20250115001」として返されることを確認', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '田中花子',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result: UpdateReporterOutput = await updateReporter(input);

    expect(result.changeHistoryId).toBe('CHG20250115001');
  });
});
