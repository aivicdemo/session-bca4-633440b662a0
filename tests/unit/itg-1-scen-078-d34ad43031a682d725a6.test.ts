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

describe('SCEN-078: 人事異動情報が空の場合、登録・更新・削除は行われず、変更履歴が記録されず、実行サマリーに件数0が反映される', () => {
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
  });

  it('空の人事異動配列を入力すると、全ての依存先が呼び出されず、全件数が0のサマリーが返される', async () => {
    const executionTimestamp = new Date();
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [],
      executionTimestamp,
    };

    const output = (await runTx7Imp1Agent(input, {})) as Tx7Imp1AgentOutput;

    // 戻り値の型確認
    expect(output).toBeDefined();
    expect(output).toHaveProperty('registeredReporters');
    expect(output).toHaveProperty('updatedReporters');
    expect(output).toHaveProperty('deactivatedReporters');
    expect(output).toHaveProperty('changeHistoryRecorded');
    expect(output).toHaveProperty('executionSummary');

    // 配列が空であることを確認
    expect(output.registeredReporters).toEqual([]);
    expect(output.updatedReporters).toEqual([]);
    expect(output.deactivatedReporters).toEqual([]);

    // 変更履歴が記録されていないことを確認
    expect(output.changeHistoryRecorded).toBe(false);

    // 実行サマリーに全て0であることを確認
    expect(output.executionSummary).toMatch(/登録件数:\s*0/);
    expect(output.executionSummary).toMatch(/更新件数:\s*0/);
    expect(output.executionSummary).toMatch(/削除件数:\s*0/);
    expect(output.executionSummary).toMatch(/エラー件数:\s*0/);

    // 依存先の呼び出しがないことを確認
    expect(mockRegisterReporter).not.toHaveBeenCalled();
    expect(mockUpdateReporter).not.toHaveBeenCalled();
    expect(mockDeactivateReporter).not.toHaveBeenCalled();
    expect(mockValidateUserInformationRequired).not.toHaveBeenCalled();
    expect(mockDetectDuplicateEmailAddress).not.toHaveBeenCalled();
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockUpdateReporterInMaster).not.toHaveBeenCalled();
    expect(mockDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
    expect(mockSendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
