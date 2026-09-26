import { runTx7Imp1Agent, Tx7Imp1AgentInput, Tx7Imp1AgentOutput, Tx7Imp1AiClient, PersonnelMovementRecord, ReporterRegistrationResult } from '../../src/agents/tx-7-imp-1/orchestrator';
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
  userId: 'usr_new_002',
  userName: 'user_new_002',
  fullName: '新入社員H',
  email: 'new_h@company.com',
  department: '営業部',
  teamId: 'team_sales_01',
  effectiveDate: new Date('2024-04-01T00:00:00+09:00'),
};

describe('SCEN-079: チームリーダーへの通知送信が失敗した場合、leaderNotificationSentがfalseとなり処理は続行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue(true);
    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue(false);

    (registerReporter as jest.MockedFunction<any>).mockResolvedValue({
      userId: NEW_HIRE.userId,
      status: 'success',
    });

    (registerReporterToMaster as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
    });

    (persistReporterMasterChangeHistory as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
    });

    // sendUserInformationApprovalNotification のみ失敗させる
    (sendUserInformationApprovalNotification as jest.MockedFunction<any>).mockRejectedValue(
      new Error('Notification delivery failed')
    );
  });

  it('通知送信失敗時、leaderNotificationSentはfalseだが、登録処理は成功して完了する', async () => {
    const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
    const aiClient: Tx7Imp1AiClient = {} as any;

    const result = await runTx7Imp1Agent(
      {
        personnelMovementData: [NEW_HIRE],
        executionTimestamp,
      } as Tx7Imp1AgentInput,
      aiClient
    ) as Tx7Imp1AgentOutput;

    expect(result.leaderNotificationSent).toBe(false);
    expect(result.registeredReporters).toHaveLength(1);
    expect(result.registeredReporters[0].userId).toBe(NEW_HIRE.userId);
    expect(result.updatedReporters).toEqual([]);
    expect(result.deactivatedReporters).toEqual([]);
    expect(result.changeHistoryRecorded).toBe(true);
    expect(result.executionSummary).toBe('登録件数: 1、更新件数: 0、削除件数: 0、エラー件数: 0');
  });
});
