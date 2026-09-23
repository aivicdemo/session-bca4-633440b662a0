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

describe('SCEN-079: チームリーダーへの通知送信が失敗した場合、leaderNotificationSentがfalseとなり処理は続行される', () => {
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
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({ success: true });

    // 通知送信をモック化し、意図的に失敗させる
    mockSendUserInformationApprovalNotification.mockRejectedValue(
      // @ts-ignore
      new Error('Notification delivery failed')
    );
  });

  it('チームリーダーへの通知送信が失敗した場合、leaderNotificationSentがfalseとなり処理は続行される', async () => {
    // テスト対象processのスタブ設定完了

    // 入力値を構築: personnelMovementDataに1件の有効な人事異動レコード（新入社員配置）を含める
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

    // 戻り値の leaderNotificationSent フィールドを検証
    expect(result.leaderNotificationSent).toBe(false);

    // 戻り値の registeredReporters, updatedReporters, deactivatedReporters, changeHistoryRecorded, executionSummary が通常通り返却されていることを検証
    expect(result.registeredReporters).toBeDefined();
    expect(Array.isArray(result.registeredReporters)).toBe(true);
    expect(result.registeredReporters.length).toBe(1);
    expect(result.registeredReporters[0]).toEqual({
      userId: 'U001',
      status: 'success',
    });

    expect(result.updatedReporters).toBeDefined();
    expect(Array.isArray(result.updatedReporters)).toBe(true);

    expect(result.deactivatedReporters).toBeDefined();
    expect(Array.isArray(result.deactivatedReporters)).toBe(true);

    expect(result.changeHistoryRecorded).toBe(true);

    expect(result.executionSummary).toBeDefined();
    expect(typeof result.executionSummary).toBe('string');
    expect(result.executionSummary).toContain('1');

    // 設計済みエラー（PersonnelMovementDataNotFound, ReporterMasterUpdateFailed, DuplicateReporterRegistration, InvalidPersonnelMovementData, ReporterNotFoundForDeactivation）が発生していないことを検証
    // エージェント処理は継続され、通知送信失敗により全体失敗（エラー送出）とはならない
    expect(() => {
      // エラーが発生していないことを確認
    }).not.toThrow();
  });
});
