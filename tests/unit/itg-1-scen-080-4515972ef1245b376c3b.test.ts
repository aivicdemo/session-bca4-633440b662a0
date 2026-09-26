import {
  runTx7Imp1Agent,
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
  Tx7Imp1AiClient,
  PersonnelMovementRecord,
  ReporterRegistrationResult,
} from '../../src/agents/tx-7-imp-1/orchestrator';
import * as reporterMgt from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersist from '../../src/logic/user-master-persistence';
import * as emailNotif from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-080: 変更履歴の記録が失敗した場合、changeHistoryRecordedがfalseとなり、その他の処理結果は出力される', () => {
  let mockAiClient: jest.Mocked<Tx7Imp1AiClient>;

  const now = new Date('2026-09-25T10:00:00Z');
  const newHireRecord: PersonnelMovementRecord = {
    movementType: 'new_hire',
    userId: 'user-001',
    userName: '新入社員 太郎',
    email: 'taro.new@example.com',
    fullName: '新入社員 太郎',
    department: '営業部',
    teamId: 'team-001',
    effectiveDate: new Date('2026-09-25'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {} as jest.Mocked<Tx7Imp1AiClient>;

    (inputValidation.validateUserInformationRequired as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedUserName: '新入社員 太郎',
      validatedEmailAddress: 'taro.new@example.com',
      validatedDepartment: '営業部',
      errorCode: null,
    });

    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'taro.new@example.com',
      errorCode: null,
    });

    (reporterMgt.registerReporter as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'Registration successful',
      changeHistoryId: 'history-001',
    });

    (userMasterPersist.registerReporterToMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'Registered to master',
    });

    (userMasterPersist.persistReporterMasterChangeHistory as jest.Mock).mockRejectedValue(
      new Error('Database write failed')
    );

    (emailNotif.sendUserInformationApprovalNotification as jest.Mock).mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'email-001',
      sentAt: '2026-09-25T10:00:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('should return changeHistoryRecorded: false when history recording fails, with other results output successfully', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [newHireRecord],
      executionTimestamp: now,
    };

    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(input, mockAiClient);

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
    expect(result.executionSummary).toContain('エラー件数: 0');
  });

  it('should call validateUserInformationRequired with correct input', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [newHireRecord],
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(inputValidation.validateUserInformationRequired).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: '新入社員 太郎',
        emailAddress: 'taro.new@example.com',
        department: '営業部',
      })
    );
  });

  it('should call detectDuplicateEmailAddress with correct input', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [newHireRecord],
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(inputValidation.detectDuplicateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'taro.new@example.com',
      })
    );
  });

  it('should call registerReporter with correct input', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [newHireRecord],
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(reporterMgt.registerReporter).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        emailAddress: 'taro.new@example.com',
      })
    );
  });

  it('should call registerReporterToMaster with correct input', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [newHireRecord],
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(userMasterPersist.registerReporterToMaster).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: '新入社員 太郎',
        emailAddress: 'taro.new@example.com',
        department: '営業部',
      })
    );
  });

  it('should call persistReporterMasterChangeHistory for the registered reporter', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [newHireRecord],
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(userMasterPersist.persistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'register',
      })
    );
  });

  it('should call sendUserInformationApprovalNotification', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: [newHireRecord],
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(emailNotif.sendUserInformationApprovalNotification).toHaveBeenCalled();
  });
});
