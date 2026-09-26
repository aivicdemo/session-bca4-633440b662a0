import { runTx7Imp1Agent, Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';
import {
  validateUserInformationRequired,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  deactivateReporter,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/reporter-master-management');

const RETIREE = {
  movementType: 'retirement' as const,
  userId: 'usr_retire_999',
  userName: 'user_retire_999',
  fullName: '退職者G',
  email: 'retire_g@company.com',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-077: 削除対象の報告者がマスタに存在しない場合、ReporterNotFoundForDeactivationエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue(true);
    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue(false);

    (deactivateReporter as jest.MockedFunction<any>).mockResolvedValue({
      userId: RETIREE.userId,
      status: 'success',
      deactivationReason: 'retirement',
    });

    const error = new Error('削除対象の報告者が見つかりません。');
    error.name = 'ReporterNotFoundForDeactivation';
    (deactivateReporterInMaster as jest.MockedFunction<any>).mockRejectedValue(error);
  });

  it('マスタに存在しない報告者の削除でReporterNotFoundForDeactivationエラーが発生する', async () => {
    const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
    const aiClient: Tx7Imp1AiClient = {} as any;

    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [RETIREE],
        executionTimestamp,
      } as Tx7Imp1AgentInput,
      aiClient
    );

    await expect(resultPromise).rejects.toThrow(
      '削除対象の報告者が見つかりません。'
    );
  });
});
