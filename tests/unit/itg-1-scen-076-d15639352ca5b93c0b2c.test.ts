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

const NEW_HIRE = {
  movementType: 'new_hire' as const,
  userId: 'usr_new_101',
  userName: 'user_new_101',
  fullName: '新入社員D',
  email: 'new_d@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

const TRANSFER = {
  movementType: 'transfer' as const,
  userId: 'usr_move_101',
  userName: 'user_move_101',
  fullName: '異動者E',
  email: 'move_e@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

const RETIREE = {
  movementType: 'retirement' as const,
  userId: 'usr_retire_101',
  userName: 'user_retire_101',
  fullName: '退職者F',
  email: 'retire_f@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-076: 報告者マスタの登録・更新・削除処理がシステム障害により失敗した場合、ReporterMasterUpdateFailedエラーが発生する', () => {
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
      reporterId: NEW_HIRE.userId,
      success: true,
      message: '登録成功',
      changeHistoryId: null,
    });

    const updateError = new Error('報告者マスタの更新に失敗しました。');
    (updateError as any).name = 'ReporterMasterUpdateFailed';
    jest.spyOn(reporterMasterModule, 'updateReporter').mockRejectedValue(updateError);

    jest.spyOn(reporterMasterModule, 'deactivateReporter').mockResolvedValue({
      reporterId: RETIREE.userId,
      success: true,
      message: '削除成功',
      archivedReportCount: 0,
      changeHistoryId: null,
    });

    jest.spyOn(userMasterModule, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ登録成功'
    });
    jest.spyOn(userMasterModule, 'updateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ更新成功'
    });
    jest.spyOn(userMasterModule, 'deactivateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ削除成功'
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

  it('updateReporterのシステム障害によりReporterMasterUpdateFailedエラーが発生する', async () => {
    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [NEW_HIRE, TRANSFER, RETIREE],
        executionTimestamp,
      },
      mockAiClient
    );

    await expect(resultPromise).rejects.toThrow(
      '報告者マスタの更新に失敗しました。'
    );
  });
});
