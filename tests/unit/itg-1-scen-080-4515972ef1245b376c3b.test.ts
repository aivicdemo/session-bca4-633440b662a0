import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';

// テストで使用する型定義
interface PersonnelMovementRecord {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  team: string;
  movementType: 'NEW_HIRE' | 'TRANSFER' | 'RETIREMENT';
  effectiveDate: Date;
}

interface Tx7Imp1AgentInput {
  personnelMovementData: PersonnelMovementRecord[];
  executionTimestamp: Date;
}

interface Tx7Imp1AgentOutput {
  registeredReporters: unknown[];
  updatedReporters: unknown[];
  deactivatedReporters: unknown[];
  changeHistoryRecorded: boolean;
  leaderNotificationSent?: boolean;
  executionSummary: string;
}

// 依存先のモック
jest.mock('../../src/logic/reporter-master-management.ts', () => ({
  registerReporter: jest.fn(),
  updateReporter: jest.fn(),
  deactivateReporter: jest.fn(),
}));

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateUserInformationRequired: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  registerReporterToMaster: jest.fn(),
  updateReporterInMaster: jest.fn(),
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

jest.mock('../../src/logic/email-notification-management.ts', () => ({
  sendUserInformationApprovalNotification: jest.fn(),
}));

describe('SCEN-080: 変更履歴の記録が失敗した場合、changeHistoryRecordedがfalseとなり、その他の処理結果は出力される', () => {
  let mockRegisterReporter: jest.Mock;
  let mockUpdateReporter: jest.Mock;
  let mockDeactivateReporter: jest.Mock;
  let mockValidateUserInformationRequired: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockUpdateReporterInMaster: jest.Mock;
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;
  let mockSendUserInformationApprovalNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const reporterMasterMgmt = require('../../src/logic/reporter-master-management.ts');
    const inputValidation = require('../../src/logic/input-validation-formatting.ts');
    const userMasterPersistence = require('../../src/logic/user-master-persistence.ts');
    const emailNotification = require('../../src/logic/email-notification-management.ts');

    mockRegisterReporter = reporterMasterMgmt.registerReporter;
    mockUpdateReporter = reporterMasterMgmt.updateReporter;
    mockDeactivateReporter = reporterMasterMgmt.deactivateReporter;
    mockValidateUserInformationRequired = inputValidation.validateUserInformationRequired;
    mockDetectDuplicateEmailAddress = inputValidation.detectDuplicateEmailAddress;
    mockRegisterReporterToMaster = userMasterPersistence.registerReporterToMaster;
    mockUpdateReporterInMaster = userMasterPersistence.updateReporterInMaster;
    mockDeactivateReporterInMaster = userMasterPersistence.deactivateReporterInMaster;
    mockPersistReporterMasterChangeHistory = userMasterPersistence.persistReporterMasterChangeHistory;
    mockSendUserInformationApprovalNotification = emailNotification.sendUserInformationApprovalNotification;

    // デフォルト: 成功応答を設定
    (mockValidateUserInformationRequired as jest.Mock<any>).mockResolvedValue({ valid: true });
    (mockDetectDuplicateEmailAddress as jest.Mock<any>).mockResolvedValue({ isDuplicate: false });
    (mockRegisterReporter as jest.Mock<any>).mockResolvedValue({ id: 'reporter-1', name: 'New Employee' });
    (mockRegisterReporterToMaster as jest.Mock<any>).mockResolvedValue({ registered: true });
    (mockSendUserInformationApprovalNotification as jest.Mock<any>).mockResolvedValue({ sent: true });

    // persistReporterMasterChangeHistory は失敗
    (mockPersistReporterMasterChangeHistory as jest.Mock<any>).mockRejectedValue(
      new Error('Database write failed')
    );
  });

  it('変更履歴記録失敗時、changeHistoryRecordedはfalseだが、マスタ変更と通知は成功して反映される', async () => {
    const executionTimestamp = new Date();
    const personnel: PersonnelMovementRecord = {
      employeeId: 'EMP001',
      name: 'New Employee',
      email: 'newemp@example.com',
      department: 'Engineering',
      team: 'Platform',
      movementType: 'NEW_HIRE',
      effectiveDate: new Date('2026-09-01'),
    };

    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [personnel],
      executionTimestamp,
    };

    const output = (await runTx7Imp1Agent(input, {})) as Tx7Imp1AgentOutput;

    // 登録結果は返される
    expect(output.registeredReporters).toHaveLength(1);
    expect(output.registeredReporters[0]).toBeDefined();

    // 更新・削除は対象外
    expect(output.updatedReporters).toEqual([]);
    expect(output.deactivatedReporters).toEqual([]);

    // 変更履歴記録が失敗したことを確認
    expect(output.changeHistoryRecorded).toBe(false);

    // 通知送信は成功したことを確認
    expect(output.leaderNotificationSent).toBe(true);

    // 実行サマリーに登録1件が反映される
    expect(output.executionSummary).toMatch(/登録件数:\s*1/);
    expect(output.executionSummary).toMatch(/更新件数:\s*0/);
    expect(output.executionSummary).toMatch(/削除件数:\s*0/);
    expect(output.executionSummary).toMatch(/エラー件数:\s*0/);
  });
});
