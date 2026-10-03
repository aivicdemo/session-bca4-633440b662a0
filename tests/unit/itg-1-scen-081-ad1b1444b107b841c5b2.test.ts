import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/reporter-master-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reporter-master-management')>('../../src/logic/reporter-master-management'),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
}));
jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
}));

import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import * as reporterMgt from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersist from '../../src/logic/user-master-persistence';
import * as emailNotif from '../../src/logic/email-notification-management';

describe('SCEN-081: 複数の人事異動レコードが入力された場合、各々について登録・更新・削除の判定が実行され、実行サマリーに全件数が反映される', () => {
  const now = new Date('2026-09-25T10:00:00Z');
  const mockAiClient: Tx7Imp1AiClient = {};

  const newHireRecords = [
    {
      movementType: 'new_hire' as const,
      userId: 'user-001',
      userName: '新入社員 太郎',
      email: 'taro.new@example.com',
      fullName: '新入社員 太郎',
      department: '営業部',
      teamId: 'team-001',
      effectiveDate: new Date('2026-09-25'),
    },
    {
      movementType: 'new_hire',
      userId: 'user-002',
      userName: '新入社員 花子',
      email: 'hanako.new@example.com',
      fullName: '新入社員 花子',
      department: '企画部',
      teamId: 'team-002',
      effectiveDate: new Date('2026-09-25'),
    },
    {
      movementType: 'new_hire',
      userId: 'user-003',
      userName: '新入社員 次郎',
      email: 'jiro.new@example.com',
      fullName: '新入社員 次郎',
      department: '開発部',
      teamId: 'team-003',
      effectiveDate: new Date('2026-09-25'),
    },
  ];

  const transferRecords = [
    {
      movementType: 'transfer' as const,
      userId: 'user-004',
      userName: '異動者 佐藤',
      email: 'sato.transfer@example.com',
      fullName: '異動者 佐藤',
      department: '営業部',
      teamId: 'team-001',
      effectiveDate: new Date('2026-09-25'),
    },
    {
      movementType: 'transfer',
      userId: 'user-005',
      userName: '異動者 鈴木',
      email: 'suzuki.transfer@example.com',
      fullName: '異動者 鈴木',
      department: '企画部',
      teamId: 'team-002',
      effectiveDate: new Date('2026-09-25'),
    },
  ];

  const retirementRecord = {
    movementType: 'retirement' as const,
    userId: 'user-006',
    userName: '退職者 田中',
    email: 'tanaka.retire@example.com',
    fullName: '退職者 田中',
    department: '営業部',
    teamId: 'team-001',
    effectiveDate: new Date('2026-09-25'),
  };

  const allRecords = [
    ...newHireRecords,
    ...transferRecords,
    retirementRecord,
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(inputValidation, 'validateUserInformationRequired').mockResolvedValue({
      isValid: true,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: null,
    });

    jest.spyOn(inputValidation, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: null,
    });

    jest.spyOn(reporterMgt, 'registerReporter').mockImplementation((input: any) =>
      Promise.resolve({
        reporterId: `reporter-${input.userId}`,
        success: true,
        message: 'Registration successful',
        changeHistoryId: null,
      })
    );

    jest.spyOn(reporterMgt, 'updateReporter').mockImplementation((input: any) =>
      Promise.resolve({
        reporterId: input.reporterId,
        success: true,
        message: 'Update successful',
        changeHistoryId: null,
      })
    );

    jest.spyOn(reporterMgt, 'deactivateReporter').mockImplementation((input: any) =>
      Promise.resolve({
        reporterId: input.reporterId,
        success: true,
        message: 'Deactivation successful',
        archivedReportCount: 0,
        changeHistoryId: null,
      })
    );

    jest.spyOn(userMasterPersist, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ登録成功',
    });

    jest.spyOn(userMasterPersist, 'updateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ更新成功',
    });

    jest.spyOn(userMasterPersist, 'deactivateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ削除成功',
    });

    jest.spyOn(userMasterPersist, 'persistReporterMasterChangeHistory').mockResolvedValue({
      success: true,
      changeHistoryId: null,
      message: '変更履歴記録成功',
    });

    jest.spyOn(emailNotif, 'sendUserInformationApprovalNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('should process all 6 records (3 new_hire + 2 transfer + 1 retirement) and return correct counts', async () => {
    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: allRecords as any,
        executionTimestamp: now,
      },
      mockAiClient
    );

    expect(result.registeredReporters).toHaveLength(3);
    expect(result.updatedReporters).toHaveLength(2);
    expect(result.deactivatedReporters).toHaveLength(1);

    expect(result.changeHistoryRecorded).toBe(true);
    expect(result.leaderNotificationSent).toBe(true);

    expect(result.executionSummary).toContain('登録件数: 3');
    expect(result.executionSummary).toContain('更新件数: 2');
    expect(result.executionSummary).toContain('削除件数: 1');
    expect(result.executionSummary).toContain('エラー件数: 0');
  });

  it('should exceed AIVIC goal constraint of 5 people with 6 total operations', async () => {
    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: allRecords as any,
        executionTimestamp: now,
      },
      mockAiClient
    );

    const totalChanges =
      result.registeredReporters.length +
      result.updatedReporters.length +
      result.deactivatedReporters.length;

    expect(totalChanges).toBe(6);
    expect(totalChanges).toBeGreaterThan(5);
  });

  it('should not throw PersonnelMovementDataNotFound error when processing 6 records', async () => {
    await expect(runTx7Imp1Agent(
      {
        personnelMovementData: allRecords as any,
        executionTimestamp: now,
      },
      mockAiClient
    )).resolves.toBeDefined();
  });
});
