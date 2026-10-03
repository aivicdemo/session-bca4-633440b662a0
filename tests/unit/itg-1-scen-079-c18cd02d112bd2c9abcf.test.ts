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
  userId: 'usr_new_002',
  userName: 'user_new_002',
  fullName: '新入社員H',
  email: 'new_h@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-079: チームリーダーへの通知送信が失敗した場合、leaderNotificationSentがfalseとなり処理は続行される', () => {
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

    jest.spyOn(userMasterModule, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'マスタ登録成功',
    });

    jest.spyOn(userMasterModule, 'persistReporterMasterChangeHistory').mockResolvedValue({
      success: true,
      changeHistoryId: null,
      message: '変更履歴記録成功',
    });

    jest.spyOn(emailNotifModule, 'sendUserInformationApprovalNotification').mockRejectedValue(
      new Error('Notification delivery failed')
    );
  });

  it('通知送信失敗時、leaderNotificationSentはfalseだが、登録処理は成功して完了する', async () => {
    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: [NEW_HIRE],
        executionTimestamp,
      },
      mockAiClient
    );

    expect(result.leaderNotificationSent).toBe(false);
    expect(result.registeredReporters).toHaveLength(1);
    expect(result.registeredReporters[0].userId).toBe(NEW_HIRE.userId);
    expect(result.updatedReporters).toEqual([]);
    expect(result.deactivatedReporters).toEqual([]);
    expect(result.changeHistoryRecorded).toBe(true);
    expect(result.executionSummary).toContain('登録件数: 1');
    expect(result.executionSummary).toContain('更新件数: 0');
    expect(result.executionSummary).toContain('削除件数: 0');
  });
});
