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

const RETIREE = {
  movementType: 'retirement' as const,
  userId: 'usr_retire_999',
  userName: 'user_retire_999',
  fullName: '退職者G',
  email: 'retire_g@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-077: 削除対象の報告者がマスタに存在しない場合、ReporterNotFoundForDeactivationエラーが発生する', () => {
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

    jest.spyOn(reporterMasterModule, 'deactivateReporter').mockResolvedValue({
      reporterId: RETIREE.userId,
      success: true,
      message: '削除成功',
      archivedReportCount: 0,
      changeHistoryId: null,
    });

    const error = new Error('削除対象の報告者が見つかりません。');
    (error as any).name = 'ReporterNotFoundForDeactivation';
    jest.spyOn(userMasterModule, 'deactivateReporterInMaster').mockRejectedValue(error);

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

  it('マスタに存在しない報告者の削除でReporterNotFoundForDeactivationエラーが発生する', async () => {
    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [RETIREE],
        executionTimestamp,
      },
      mockAiClient
    );

    await expect(resultPromise).rejects.toThrow(
      '削除対象の報告者が見つかりません。'
    );
  });
});
