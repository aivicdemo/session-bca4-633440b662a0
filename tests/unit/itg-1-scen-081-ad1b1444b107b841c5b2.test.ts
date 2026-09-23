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

describe('SCEN-081: 複数の人事異動レコードが入力された場合、各々について登録・更新・削除の判定が実行され、実行サマリーに全件数が反映される', () => {
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

    // registerReporter、updateReporter、deactivateReporterの各々の成功設定
    // @ts-ignore
    mockRegisterReporter.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, status: 'success' })
    );
    // @ts-ignore
    mockUpdateReporter.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, status: 'success', changedFields: [] })
    );
    // @ts-ignore
    mockDeactivateReporter.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, status: 'success' })
    );

    // validateUserInformationRequired は全6件について検証成功を返す
    // @ts-ignore
    mockValidateUserInformationRequired.mockResolvedValue({ isValid: true });

    // detectDuplicateEmailAddress は全6件について重複なしを返す
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });

    // registerReporterToMaster、updateReporterInMaster、deactivateReporterInMasterは全件成功を返す
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ success: true });
    // @ts-ignore
    mockUpdateReporterInMaster.mockResolvedValue({ success: true });
    // @ts-ignore
    mockDeactivateReporterInMaster.mockResolvedValue({ success: true });

    // persistReporterMasterChangeHistory はすべての変更について記録成功を返す
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({ success: true });

    // sendUserInformationApprovalNotification はすべての通知について送信成功を返す
    // @ts-ignore
    mockSendUserInformationApprovalNotification.mockResolvedValue({ success: true });
  });

  it('複数の人事異動レコードが入力された場合、各々について登録・更新・削除の判定が実行され、実行サマリーに全件数が反映される', async () => {
    // 複数の人事異動レコード（新入社員3件、異動2件、退職1件の合計6件）を準備
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [
        // 新入社員3件
        {
          movementType: 'new_hire',
          userId: 'U001',
          userName: 'user001',
          email: 'user001@example.com',
          fullName: '太郎 花子',
          department: 'Engineering',
          team: 'Platform',
        } as PersonnelMovementRecord,
        {
          movementType: 'new_hire',
          userId: 'U002',
          userName: 'user002',
          email: 'user002@example.com',
          fullName: '次郎 太郎',
          department: 'Engineering',
          team: 'Backend',
        } as PersonnelMovementRecord,
        {
          movementType: 'new_hire',
          userId: 'U003',
          userName: 'user003',
          email: 'user003@example.com',
          fullName: '三郎 次郎',
          department: 'Product',
          team: 'Design',
        } as PersonnelMovementRecord,
        // 異動2件
        {
          movementType: 'transfer',
          userId: 'U004',
          userName: 'user004',
          email: 'user004@example.com',
          fullName: '四郎 三郎',
          department: 'Engineering',
          team: 'Frontend',
        } as PersonnelMovementRecord,
        {
          movementType: 'transfer',
          userId: 'U005',
          userName: 'user005',
          email: 'user005@example.com',
          fullName: '五郎 四郎',
          department: 'Sales',
          team: 'Enterprise',
        } as PersonnelMovementRecord,
        // 退職1件
        {
          movementType: 'retirement',
          userId: 'U006',
          userName: 'user006',
          email: 'user006@example.com',
          fullName: '六郎 五郎',
          department: 'Operations',
          team: 'Admin',
        } as PersonnelMovementRecord,
      ],
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(input);

    // 出力型 Tx7Imp1AgentOutput の検証

    // registeredReporters.length === 3（新入社員3件すべてが ReporterRegistrationResult として記録される）
    expect(result.registeredReporters).toBeDefined();
    expect(Array.isArray(result.registeredReporters)).toBe(true);
    expect((result as any).registeredReporters.length).toBe(3);
    (result as any).registeredReporters.forEach((reporter: any, index: number) => {
      expect(reporter.userId).toBe(`U${String(index + 1).padStart(3, '0')}`);
      expect(reporter.status).toBe('success');
    });

    // updatedReporters.length === 2（異動2件すべてが ReporterUpdateResult として記録される）
    expect(result.updatedReporters).toBeDefined();
    expect(Array.isArray(result.updatedReporters)).toBe(true);
    expect((result as any).updatedReporters.length).toBe(2);
    (result as any).updatedReporters.forEach((reporter: any, index: number) => {
      expect(reporter.userId).toBe(`U${String(index + 4).padStart(3, '0')}`);
      expect(reporter.status).toBe('success');
    });

    // deactivatedReporters.length === 1（退職1件が ReporterDeactivationResult として記録される）
    expect(result.deactivatedReporters).toBeDefined();
    expect(Array.isArray(result.deactivatedReporters)).toBe(true);
    expect((result as any).deactivatedReporters.length).toBe(1);
    expect(((result as any).deactivatedReporters[0]).userId).toBe('U006');
    expect(((result as any).deactivatedReporters[0]).status).toBe('success');

    // changeHistoryRecorded === true（全6件の変更履歴が記録された）
    expect(result.changeHistoryRecorded).toBe(true);

    // leaderNotificationSent === true（全6件の通知が送信された）
    expect(result.leaderNotificationSent).toBe(true);

    // executionSummary が「登録件数: 3, 更新件数: 2, 削除件数: 1, エラー件数: 0」を含む文字列であること
    expect(result.executionSummary).toBeDefined();
    expect(typeof result.executionSummary).toBe('string');
    expect(result.executionSummary).toContain('登録件数: 3');
    expect(result.executionSummary).toContain('更新件数: 2');
    expect(result.executionSummary).toContain('削除件数: 1');
    expect(result.executionSummary).toContain('エラー件数: 0');

    // AIVICゴール制約「担当は社内の5人」に対し、registeredReporters.length + updatedReporters.length + deactivatedReporters.length の合計が6件（超過）であることを確認
    const totalCount = result.registeredReporters.length + result.updatedReporters.length + result.deactivatedReporters.length;
    expect(totalCount).toBe(6);

    // 設計済みエラー PersonnelMovementDataNotFound（文言「人事異動情報を取得できませんでした。」）はスローされない
    // エージェント処理が全6件について各々の登録・更新・削除判定を全件実行できることを検証
  });
});
