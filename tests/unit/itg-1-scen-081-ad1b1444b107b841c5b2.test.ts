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

describe('SCEN-081: 複数の人事異動レコードが入力された場合、各々について登録・更新・削除の判定が実行され、実行サマリーに全件数が反映される', () => {
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

    // 全てのスタブを成功応答に設定
    (mockValidateUserInformationRequired as jest.Mock<any>).mockResolvedValue({ valid: true });
    (mockDetectDuplicateEmailAddress as jest.Mock<any>).mockResolvedValue({ isDuplicate: false });
    (mockRegisterReporter as jest.Mock<any>).mockImplementation((id) =>
      Promise.resolve({ id, name: 'New Employee' })
    );
    (mockUpdateReporter as jest.Mock<any>).mockImplementation((id) =>
      Promise.resolve({ id, updated: true })
    );
    (mockDeactivateReporter as jest.Mock<any>).mockImplementation((id) =>
      Promise.resolve({ id, deactivated: true })
    );
    (mockRegisterReporterToMaster as jest.Mock<any>).mockResolvedValue({ registered: true });
    (mockUpdateReporterInMaster as jest.Mock<any>).mockResolvedValue({ updated: true });
    (mockDeactivateReporterInMaster as jest.Mock<any>).mockResolvedValue({ deactivated: true });
    (mockPersistReporterMasterChangeHistory as jest.Mock<any>).mockResolvedValue({ recorded: true });
    (mockSendUserInformationApprovalNotification as jest.Mock<any>).mockResolvedValue({ sent: true });
  });

  it('複数の異動レコード（新入社員3件、異動2件、退職1件）を処理すると、全件数が正確にサマリーに反映される', async () => {
    const executionTimestamp = new Date();

    // 新入社員3件
    const newHires: PersonnelMovementRecord[] = [
      {
        employeeId: 'EMP001',
        name: 'New Employee 1',
        email: 'newemp1@example.com',
        department: 'Engineering',
        team: 'Platform',
        movementType: 'NEW_HIRE',
        effectiveDate: new Date('2026-09-01'),
      },
      {
        employeeId: 'EMP002',
        name: 'New Employee 2',
        email: 'newemp2@example.com',
        department: 'Sales',
        team: 'Japan',
        movementType: 'NEW_HIRE',
        effectiveDate: new Date('2026-09-01'),
      },
      {
        employeeId: 'EMP003',
        name: 'New Employee 3',
        email: 'newemp3@example.com',
        department: 'HR',
        team: 'Recruitment',
        movementType: 'NEW_HIRE',
        effectiveDate: new Date('2026-09-01'),
      },
    ];

    // 異動2件
    const transfers: PersonnelMovementRecord[] = [
      {
        employeeId: 'EMP101',
        name: 'Transferred Employee 1',
        email: 'transfer1@example.com',
        department: 'Engineering',
        team: 'Backend',
        movementType: 'TRANSFER',
        effectiveDate: new Date('2026-09-15'),
      },
      {
        employeeId: 'EMP102',
        name: 'Transferred Employee 2',
        email: 'transfer2@example.com',
        department: 'Product',
        team: 'Design',
        movementType: 'TRANSFER',
        effectiveDate: new Date('2026-09-15'),
      },
    ];

    // 退職1件
    const retirements: PersonnelMovementRecord[] = [
      {
        employeeId: 'EMP201',
        name: 'Retired Employee',
        email: 'retired@example.com',
        department: 'Operations',
        team: 'General',
        movementType: 'RETIREMENT',
        effectiveDate: new Date('2026-09-30'),
      },
    ];

    const allPersonnel = [...newHires, ...transfers, ...retirements];

    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allPersonnel,
      executionTimestamp,
    };

    const output = (await runTx7Imp1Agent(input, {})) as Tx7Imp1AgentOutput;

    // registeredReporters.length === 3（新入社員3件）
    expect(output.registeredReporters).toHaveLength(3);

    // updatedReporters.length === 2（異動2件）
    expect(output.updatedReporters).toHaveLength(2);

    // deactivatedReporters.length === 1（退職1件）
    expect(output.deactivatedReporters).toHaveLength(1);

    // changeHistoryRecorded === true
    expect(output.changeHistoryRecorded).toBe(true);

    // leaderNotificationSent === true
    expect(output.leaderNotificationSent).toBe(true);

    // 実行サマリーに全件数が反映される
    expect(output.executionSummary).toMatch(/登録件数:\s*3/);
    expect(output.executionSummary).toMatch(/更新件数:\s*2/);
    expect(output.executionSummary).toMatch(/削除件数:\s*1/);
    expect(output.executionSummary).toMatch(/エラー件数:\s*0/);

    // 設計済みエラーが発生していない
    // (PersonnelMovementDataNotFound は throw されていない)
  });
});
