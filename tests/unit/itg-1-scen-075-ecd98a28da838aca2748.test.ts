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

const RECORD_1 = {
  movementType: 'new_hire' as const,
  userId: 'EMP001',
  userName: 'user_emp001',
  fullName: '従業員001',
  email: 'emp001@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

const RECORD_2 = {
  movementType: 'new_hire' as const,
  userId: 'EMP001',
  userName: 'user_emp001',
  fullName: '従業員001',
  email: 'emp001@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-075: 同一ユーザーIDまたはメールアドレスで既に報告者が登録されている場合、DuplicateReporterRegistrationエラーが発生する', () => {
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

    jest.spyOn(validationModule, 'detectDuplicateEmailAddress')
      .mockResolvedValueOnce({
        isDuplicate: false,
        validatedEmailAddress: null,
        errorCode: null,
      })
      .mockResolvedValueOnce({
        isDuplicate: true,
        validatedEmailAddress: null,
        errorCode: null,
      });

    jest.spyOn(reporterMasterModule, 'registerReporter').mockResolvedValue({
      reporterId: RECORD_1.userId,
      success: true,
      message: '登録成功',
      changeHistoryId: null,
    });

    const error = new Error('既に登録されている報告者です。');
    (error as any).name = 'DuplicateReporterRegistration';

    jest.spyOn(userMasterModule, 'registerReporterToMaster')
      .mockResolvedValueOnce({ success: true, reporterId: null, message: 'マスタ登録成功' })
      .mockRejectedValueOnce(error);

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

  it('2件目の登録でDuplicateReporterRegistrationエラーが発生する', async () => {
    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [RECORD_1, RECORD_2],
        executionTimestamp,
      },
      mockAiClient
    );

    await expect(resultPromise).rejects.toThrow(
      '既に登録されている報告者です。'
    );
  });
});
