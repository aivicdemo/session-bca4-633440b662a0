import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx7Imp1Agent,
  PersonnelMovementRecord,
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
  ReporterRegistrationResult,
  ReporterUpdateResult,
  ReporterDeactivationResult,
  PersonnelMovementDataNotFound,
  ReporterMasterUpdateFailed,
  DuplicateReporterRegistration,
  InvalidPersonnelMovementData,
  ReporterNotFoundForDeactivation,
} from '../../src/agents/tx-7-imp-1/orchestrator';

// 依存先のモック
jest.mock('../../src/logic/reporter-master-management.ts', () => ({
  registerReporter: jest.fn().mockImplementation(() => Promise.resolve({})),
  updateReporter: jest.fn().mockImplementation(() => Promise.resolve({})),
  deactivateReporter: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateUserInformationRequired: jest.fn().mockImplementation(() => Promise.resolve({})),
  detectDuplicateEmailAddress: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  registerReporterToMaster: jest.fn().mockImplementation(() => Promise.resolve({})),
  updateReporterInMaster: jest.fn().mockImplementation(() => Promise.resolve({})),
  deactivateReporterInMaster: jest.fn().mockImplementation(() => Promise.resolve({})),
  persistReporterMasterChangeHistory: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

jest.mock('../../src/logic/email-notification-management.ts', () => ({
  sendUserInformationApprovalNotification: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

describe('SCEN-080: 変更履歴の記録が失敗した場合、changeHistoryRecordedがfalseとなり、その他の処理結果は出力される', () => {
  let mockSendUserInformationApprovalNotification: jest.Mock;
  let mockRegisterReporter: jest.Mock;
  let mockUpdateReporter: jest.Mock;
  let mockDeactivateReporter: jest.Mock;
  let mockValidateUserInformationRequired: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockUpdateReporterInMaster: jest.Mock;
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 各モックを取得
    mockRegisterReporter = require('../../src/logic/reporter-master-management.ts').registerReporter as jest.Mock;
    mockUpdateReporter = require('../../src/logic/reporter-master-management.ts').updateReporter as jest.Mock;
    mockDeactivateReporter = require('../../src/logic/reporter-master-management.ts').deactivateReporter as jest.Mock;
    mockValidateUserInformationRequired = require('../../src/logic/input-validation-formatting.ts').validateUserInformationRequired as jest.Mock;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts').detectDuplicateEmailAddress as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts').registerReporterToMaster as jest.Mock;
    mockUpdateReporterInMaster = require('../../src/logic/user-master-persistence.ts').updateReporterInMaster as jest.Mock;
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;
    mockSendUserInformationApprovalNotification = require('../../src/logic/email-notification-management.ts').sendUserInformationApprovalNotification as jest.Mock;

    // 成功応答に設定
    // @ts-ignore
    mockRegisterReporter.mockResolvedValue({ userId: 'U001', status: 'success' });
    // @ts-ignore
    mockUpdateReporter.mockResolvedValue({ userId: 'U001', status: 'success', changedFields: [] });
    // @ts-ignore
    mockDeactivateReporter.mockResolvedValue({ userId: 'U001', status: 'success' });
    // @ts-ignore
    mockValidateUserInformationRequired.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ success: true });
    // @ts-ignore
    mockUpdateReporterInMaster.mockResolvedValue({ success: true });
    // @ts-ignore
    mockDeactivateReporterInMaster.mockResolvedValue({ success: true });

    // 変更履歴記録処理をスタブ化し、失敗させる
    mockPersistReporterMasterChangeHistory.mockRejectedValue(
      // @ts-ignore
      new Error('Database write failed')
    );

    // 通知送信は成功
    // @ts-ignore
    mockSendUserInformationApprovalNotification.mockResolvedValue({ success: true });
  });

  it('変更履歴の記録が失敗した場合、changeHistoryRecordedがfalseとなり、その他の処理結果は出力される', async () => {
    // 入力値を構築: personnelMovementDataに1件の新入社員異動レコード（必須項目を含む）を準備
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [
        {
          movementType: 'new_hire',
          userId: 'U001',
          userName: 'user001',
          email: 'user001@example.com',
          fullName: '太郎 花子',
          department: 'Engineering',
          team: 'Platform',
        } as PersonnelMovementRecord,
      ],
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(input);

    // 戻り値の出力型 Tx7Imp1AgentOutput を検証

    // changeHistoryRecorded: false（変更履歴記録処理が失敗したため）
    expect(result.changeHistoryRecorded).toBe(false);

    // registeredReporters: 1件の ReporterRegistrationResult を含む（新規登録が正常に完結したことを示す）
    expect(result.registeredReporters).toBeDefined();
    expect(Array.isArray(result.registeredReporters)).toBe(true);
    expect(result.registeredReporters.length).toBe(1);
    expect(result.registeredReporters[0]).toEqual({
      userId: 'U001',
      status: 'success',
    });

    // updatedReporters: 空配列（更新対象なし）
    expect(result.updatedReporters).toBeDefined();
    expect(Array.isArray(result.updatedReporters)).toBe(true);
    expect(result.updatedReporters.length).toBe(0);

    // deactivatedReporters: 空配列（削除対象なし）
    expect(result.deactivatedReporters).toBeDefined();
    expect(Array.isArray(result.deactivatedReporters)).toBe(true);
    expect(result.deactivatedReporters.length).toBe(0);

    // leaderNotificationSent: true（通知送信は成功した）
    expect(result.leaderNotificationSent).toBe(true);

    // executionSummary: 「登録件数: 1、更新件数: 0、削除件数: 0、エラー件数: 0」を含む文字列
    expect(result.executionSummary).toBeDefined();
    expect(typeof result.executionSummary).toBe('string');
    expect(result.executionSummary).toContain('登録件数: 1');
    expect(result.executionSummary).toContain('更新件数: 0');
    expect(result.executionSummary).toContain('削除件数: 0');
    expect(result.executionSummary).toContain('エラー件数: 0');
  });
});
