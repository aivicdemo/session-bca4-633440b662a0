import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  retrieveReporterByUserId,
  updateReporterInMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-379: すべての更新項目が任意で指定されない場合、現在の値が保持されて成功する', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockRetrieveReporterByUserId: jest.Mock;
  let mockUpdateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
    mockRetrieveReporterByUserId = retrieveReporterByUserId as jest.Mock;
    mockUpdateReporterInMaster = updateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

    // 既存報告者の情報を取得するモック
    // @ts-ignore
    mockRetrieveReporterByUserId.mockResolvedValue({
      reporterId: 'R001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      department: '営業部',
      status: 'active',
    });

    // 検証処理は成功
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue(undefined);
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue(undefined);
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue(undefined);

    // 更新処理は成功
    // @ts-ignore
    mockUpdateReporterInMaster.mockResolvedValue({ success: true });

    // 変更履歴記録は成功
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'CH12345',
    });
  });

  it('任意フィールドが指定されない場合、現在の値が保持されて成功する', async () => {
    // 入力値: すべて undefined
    const input: UpdateReporterInput = {
      reporterId: 'R001',
      reporterName: undefined,
      emailAddress: undefined,
      department: undefined,
      status: undefined,
      teamLeaderId: 'L001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    // テスト対象関数を実行
    const result: UpdateReporterOutput = await updateReporter(input);

    // 期待結果を検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toBe('報告者情報の更新が成功しました。');
    expect(result.changeHistoryId).toBe('CH12345');

    // updateReporterInMaster が既存値を保持して呼ばれたことを検証
    // @ts-ignore
    expect(mockUpdateReporterInMaster).toHaveBeenCalledWith({
      reporterId: 'R001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      department: '営業部',
      status: 'active',
    });

    // persistReporterMasterChangeHistory が正しい引数で呼ばれたことを検証
    // @ts-ignore
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalledWith({
      reporterId: 'R001',
      teamLeaderId: 'L001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    });
  });
});
