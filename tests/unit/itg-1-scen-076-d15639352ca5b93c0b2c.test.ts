import { runTx7Imp1Agent, Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
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
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-076: 報告者マスタの登録・更新・削除処理がシステム障害により失敗した場合、ReporterMasterUpdateFailedエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue(true);
    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue(false);

    (registerReporter as jest.MockedFunction<any>).mockResolvedValue({
      userId: NEW_HIRE.userId,
      status: 'success',
    });

    const updateError = new Error('報告者マスタの更新に失敗しました。');
    updateError.name = 'ReporterMasterUpdateFailed';
    (updateReporter as jest.MockedFunction<any>).mockRejectedValue(updateError);

    (deactivateReporter as jest.MockedFunction<any>).mockResolvedValue({
      userId: RETIREE.userId,
      status: 'success',
      deactivationReason: 'retirement',
    });

    (registerReporterToMaster as jest.MockedFunction<any>).mockResolvedValue({ success: true });
    (updateReporterInMaster as jest.MockedFunction<any>).mockResolvedValue({ success: true });
    (deactivateReporterInMaster as jest.MockedFunction<any>).mockResolvedValue({ success: true });
    (persistReporterMasterChangeHistory as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
    });

    (sendUserInformationApprovalNotification as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
    });
  });

  it('updateReporterのシステム障害によりReporterMasterUpdateFailedエラーが発生する', async () => {
    const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
    const aiClient: Tx7Imp1AiClient = {} as any;

    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [NEW_HIRE, TRANSFER, RETIREE],
        executionTimestamp,
      } as Tx7Imp1AgentInput,
      aiClient
    );

    await expect(resultPromise).rejects.toThrow(
      '報告者マスタの更新に失敗しました。'
    );
  });
});
