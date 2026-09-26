import { runTx7Imp1Agent, Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import {
  validateUserInformationRequired,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import { registerReporterToMaster } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

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
  beforeEach(() => {
    jest.clearAllMocks();

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue(true);

    (detectDuplicateEmailAddress as jest.MockedFunction<any>)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const error = new Error('既に登録されている報告者です。');
    error.name = 'DuplicateReporterRegistration';

    (registerReporterToMaster as jest.MockedFunction<any>)
      .mockResolvedValueOnce({ success: true, userId: RECORD_1.userId })
      .mockRejectedValueOnce(error);
  });

  it('2件目の登録でDuplicateReporterRegistrationエラーが発生する', async () => {
    const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
    const aiClient: Tx7Imp1AiClient = {} as any;

    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [RECORD_1, RECORD_2],
        executionTimestamp,
      } as Tx7Imp1AgentInput,
      aiClient
    );

    await expect(resultPromise).rejects.toThrow(
      '既に登録されている報告者です。'
    );
  });
});
