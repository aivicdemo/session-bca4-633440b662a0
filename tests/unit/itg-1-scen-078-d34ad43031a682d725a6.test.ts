import { runTx7Imp1Agent, Tx7Imp1AgentInput, Tx7Imp1AgentOutput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import {
  registerReporter,
  updateReporter,
  deactivateReporter,
} from '../../src/logic/reporter-master-management';
import {
  validateUserInformationRequired,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  registerReporterToMaster,
  updateReporterInMaster,
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-078: 人事異動情報が空の場合、登録・更新・削除は行われず、変更履歴が記録されず、実行サマリーに件数0が反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空の人事異動配列を入力すると、全ての依存先が呼び出されず、全件数が0のサマリーが返される', async () => {
    const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
    const aiClient: Tx7Imp1AiClient = {} as any;

    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: [],
        executionTimestamp,
      } as Tx7Imp1AgentInput,
      aiClient
    ) as Tx7Imp1AgentOutput;

    expect(result).toBeDefined();
    expect(result.registeredReporters).toEqual([]);
    expect(result.updatedReporters).toEqual([]);
    expect(result.deactivatedReporters).toEqual([]);
    expect(result.changeHistoryRecorded).toBe(false);
    expect(result.executionSummary).toBe('登録件数: 0, 更新件数: 0, 削除件数: 0, エラー件数: 0');

    expect(registerReporter).not.toHaveBeenCalled();
    expect(updateReporter).not.toHaveBeenCalled();
    expect(deactivateReporter).not.toHaveBeenCalled();
    expect(validateUserInformationRequired).not.toHaveBeenCalled();
    expect(detectDuplicateEmailAddress).not.toHaveBeenCalled();
    expect(registerReporterToMaster).not.toHaveBeenCalled();
    expect(updateReporterInMaster).not.toHaveBeenCalled();
    expect(deactivateReporterInMaster).not.toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
    expect(sendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
