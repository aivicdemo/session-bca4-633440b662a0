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
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import * as userMasterModule from '../../src/logic/user-master-persistence';
import * as emailNotifModule from '../../src/logic/email-notification-management';
import * as validationModule from '../../src/logic/input-validation-formatting';

const NEW_HIRE_A = {
  movementType: 'new_hire' as const,
  userId: 'usr_new_001',
  userName: 'user_new_001',
  fullName: '新入社員A',
  email: 'new_a@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

const TRANSFER_B = {
  movementType: 'transfer' as const,
  userId: 'usr_move_001',
  userName: 'user_move_001',
  fullName: '異動者B',
  email: 'move_b@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

const RETIREE_C = {
  movementType: 'retirement' as const,
  userId: 'usr_retire_001',
  userName: 'user_retire_001',
  fullName: '退職者C',
  email: 'retire_c@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-072: 人事異動情報から新規登録・更新・削除の必要性が判定され、報告者マスタが正常に変更され、変更履歴が記録され、チームリーダーに通知される', () => {
  const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
  const mockAiClient: Tx7Imp1AiClient = {};

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(validationModule, 'validateUserInformationRequired').mockResolvedValue({
      isValid: true,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: null,
    });

    jest.spyOn(validationModule, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: null,
    });

    jest.spyOn(reporterMasterModule, 'registerReporter').mockResolvedValue({
      reporterId: NEW_HIRE_A.userId,
      success: true,
      message: '登録成功',
      changeHistoryId: null,
    });

    jest.spyOn(reporterMasterModule, 'updateReporter').mockResolvedValue({
      reporterId: TRANSFER_B.userId,
      success: true,
      message: '更新成功',
      changeHistoryId: null,
    });

    jest.spyOn(reporterMasterModule, 'deactivateReporter').mockResolvedValue({
      reporterId: RETIREE_C.userId,
      success: true,
      message: '削除成功',
      archivedReportCount: 0,
      changeHistoryId: null,
    });

    jest.spyOn(userMasterModule, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ登録成功',
    });

    jest.spyOn(userMasterModule, 'updateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ更新成功',
    });

    jest.spyOn(userMasterModule, 'deactivateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ削除成功',
    });

    jest.spyOn(userMasterModule, 'persistReporterMasterChangeHistory').mockResolvedValue({
      success: true,
      changeHistoryId: null,
      message: '変更履歴記録成功',
    });

    jest.spyOn(emailNotifModule, 'sendUserInformationApprovalNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('新規登録1件・更新1件・削除1件を判定し、変更履歴の記録とリーダー通知が完結する', async () => {
    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: [NEW_HIRE_A, TRANSFER_B, RETIREE_C],
        executionTimestamp,
      },
      mockAiClient
    );

    expect(result.registeredReporters).toHaveLength(1);
    expect(result.registeredReporters[0].userId).toBe(NEW_HIRE_A.userId);

    expect(result.updatedReporters).toHaveLength(1);
    expect(result.updatedReporters[0].userId).toBe(TRANSFER_B.userId);

    expect(result.deactivatedReporters).toHaveLength(1);
    expect(result.deactivatedReporters[0].userId).toBe(RETIREE_C.userId);

    expect(result.changeHistoryRecorded).toBe(true);
    expect(result.leaderNotificationSent).toBe(true);

    expect(userMasterModule.persistReporterMasterChangeHistory).toHaveBeenCalledTimes(3);
    expect(emailNotifModule.sendUserInformationApprovalNotification).toHaveBeenCalledTimes(3);

    expect(result.executionSummary).toContain('登録件数: 1');
    expect(result.executionSummary).toContain('更新件数: 1');
    expect(result.executionSummary).toContain('削除件数: 1');
    expect(result.executionSummary).toContain('エラー件数: 0');
  });
});