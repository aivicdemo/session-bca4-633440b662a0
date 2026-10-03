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

const newHireRecord = {
  movementType: 'new_hire' as const,
  userId: 'user-001',
  userName: '新入社員 太郎',
  email: 'taro.new@example.com',
  fullName: '新入社員 太郎',
  department: '営業部',
  teamId: 'team-001',
  effectiveDate: new Date('2026-09-25'),
};

describe('SCEN-080: 変更履歴の記録が失敗した場合、changeHistoryRecordedがfalseとなり、その他の処理結果は出力される', () => {
  const now = new Date('2026-09-25T10:00:00Z');
  const mockAiClient: Tx7Imp1AiClient = {};

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

    jest.spyOn(reporterMgt, 'registerReporter').mockResolvedValue({
      reporterId: 'reporter-001',
      success: true,
      message: 'Registration successful',
      changeHistoryId: null,
    });

    jest.spyOn(userMasterPersist, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'Registered to master',
    });

    jest.spyOn(userMasterPersist, 'persistReporterMasterChangeHistory').mockRejectedValue(
      new Error('Database write failed')
    );

    jest.spyOn(emailNotif, 'sendUserInformationApprovalNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('should return changeHistoryRecorded: false when history recording fails, with other results output successfully', async () => {
    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: [newHireRecord],
        executionTimestamp: now,
      },
      mockAiClient
    );

    expect(result.registeredReporters).toHaveLength(1);
    expect(result.registeredReporters[0]).toEqual(
      expect.objectContaining({
        userId: 'user-001',
        status: 'success',
      })
    );

    expect(result.updatedReporters).toEqual([]);
    expect(result.deactivatedReporters).toEqual([]);

    expect(result.changeHistoryRecorded).toBe(false);

    expect(result.leaderNotificationSent).toBe(true);

    expect(result.executionSummary).toContain('登録件数: 1');
    expect(result.executionSummary).toContain('更新件数: 0');
    expect(result.executionSummary).toContain('削除件数: 0');
  });
});
