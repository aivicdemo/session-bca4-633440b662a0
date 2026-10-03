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

describe('SCEN-078: 人事異動情報が空の場合、登録・更新・削除は行われず、変更履歴が記録されず、実行サマリーに件数0が反映される', () => {
  const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
  const mockAiClient: Tx7Imp1AiClient = {};

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('空の人事異動配列を入力すると、全ての依存先が呼び出されず、全件数が0のサマリーが返される', async () => {
    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: [],
        executionTimestamp,
      },
      mockAiClient
    );

    expect(result).toBeDefined();
    expect(result.registeredReporters).toEqual([]);
    expect(result.updatedReporters).toEqual([]);
    expect(result.deactivatedReporters).toEqual([]);
    expect(result.changeHistoryRecorded).toBe(false);
    expect(result.executionSummary).toContain('登録件数: 0');
    expect(result.executionSummary).toContain('更新件数: 0');
    expect(result.executionSummary).toContain('削除件数: 0');
    expect(result.executionSummary).toContain('エラー件数: 0');

    expect(reporterMasterModule.registerReporter).not.toHaveBeenCalled();
    expect(reporterMasterModule.updateReporter).not.toHaveBeenCalled();
    expect(reporterMasterModule.deactivateReporter).not.toHaveBeenCalled();
    expect(validationModule.validateUserInformationRequired).not.toHaveBeenCalled();
    expect(validationModule.detectDuplicateEmailAddress).not.toHaveBeenCalled();
    expect(userMasterModule.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterModule.updateReporterInMaster).not.toHaveBeenCalled();
    expect(userMasterModule.deactivateReporterInMaster).not.toHaveBeenCalled();
    expect(userMasterModule.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
    expect(emailNotifModule.sendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
