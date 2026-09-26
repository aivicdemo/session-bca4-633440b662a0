import {
  runTx7Imp1Agent,
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
  Tx7Imp1AiClient,
  PersonnelMovementRecord,
  ReporterRegistrationResult,
  ReporterUpdateResult,
  ReporterDeactivationResult,
} from '../../src/agents/tx-7-imp-1/orchestrator';
import * as reporterMgt from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersist from '../../src/logic/user-master-persistence';
import * as emailNotif from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-081: 複数の人事異動レコードが入力された場合、各々について登録・更新・削除の判定が実行され、実行サマリーに全件数が反映される', () => {
  let mockAiClient: jest.Mocked<Tx7Imp1AiClient>;

  const now = new Date('2026-09-25T10:00:00Z');

  const newHireRecords: PersonnelMovementRecord[] = [
    {
      movementType: 'new_hire',
      userId: 'user-001',
      userName: '新入社員 太郎',
      email: 'taro.new@example.com',
      fullName: '新入社員 太郎',
      department: '営業部',
      teamId: 'team-001',
      effectiveDate: new Date('2026-09-25'),
    },
    {
      movementType: 'new_hire',
      userId: 'user-002',
      userName: '新入社員 花子',
      email: 'hanako.new@example.com',
      fullName: '新入社員 花子',
      department: '企画部',
      teamId: 'team-002',
      effectiveDate: new Date('2026-09-25'),
    },
    {
      movementType: 'new_hire',
      userId: 'user-003',
      userName: '新入社員 次郎',
      email: 'jiro.new@example.com',
      fullName: '新入社員 次郎',
      department: '開発部',
      teamId: 'team-003',
      effectiveDate: new Date('2026-09-25'),
    },
  ];

  const transferRecords: PersonnelMovementRecord[] = [
    {
      movementType: 'transfer',
      userId: 'user-004',
      userName: '異動者 佐藤',
      email: 'sato.transfer@example.com',
      fullName: '異動者 佐藤',
      department: '営業部',
      teamId: 'team-001',
      effectiveDate: new Date('2026-09-25'),
    },
    {
      movementType: 'transfer',
      userId: 'user-005',
      userName: '異動者 鈴木',
      email: 'suzuki.transfer@example.com',
      fullName: '異動者 鈴木',
      department: '企画部',
      teamId: 'team-002',
      effectiveDate: new Date('2026-09-25'),
    },
  ];

  const retirementRecord: PersonnelMovementRecord = {
    movementType: 'retirement',
    userId: 'user-006',
    userName: '退職者 田中',
    email: 'tanaka.retire@example.com',
    fullName: '退職者 田中',
    department: '営業部',
    teamId: 'team-001',
    effectiveDate: new Date('2026-09-25'),
  };

  const allRecords: PersonnelMovementRecord[] = [
    ...newHireRecords,
    ...transferRecords,
    retirementRecord,
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {} as jest.Mocked<Tx7Imp1AiClient>;

    (inputValidation.validateUserInformationRequired as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedUserName: '',
      validatedEmailAddress: '',
      validatedDepartment: '',
      errorCode: null,
    });

    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: '',
      errorCode: null,
    });

    (reporterMgt.registerReporter as jest.Mock).mockImplementation((input) =>
      Promise.resolve({
        success: true,
        reporterId: `reporter-${input.userId}`,
        message: 'Registration successful',
        changeHistoryId: `history-${input.userId}`,
      })
    );

    (reporterMgt.updateReporter as jest.Mock).mockImplementation((input) =>
      Promise.resolve({
        success: true,
        reporterId: input.reporterId,
        message: 'Update successful',
        changeHistoryId: `history-${input.reporterId}`,
      })
    );

    (reporterMgt.deactivateReporter as jest.Mock).mockImplementation((input) =>
      Promise.resolve({
        success: true,
        reporterId: input.reporterId,
        archivedReportCount: 0,
        message: 'Deactivation successful',
        changeHistoryId: `history-${input.reporterId}`,
      })
    );

    (userMasterPersist.registerReporterToMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'Registered to master',
    });

    (userMasterPersist.updateReporterInMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'Updated in master',
    });

    (userMasterPersist.deactivateReporterInMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'Deactivated in master',
    });

    (userMasterPersist.persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue({
      success: true,
      changeHistoryId: 'history-001',
      message: 'History recorded',
    });

    (emailNotif.sendUserInformationApprovalNotification as jest.Mock).mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'email-001',
      sentAt: '2026-09-25T10:00:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('should process all 6 records (3 new_hire + 2 transfer + 1 retirement) and return correct counts', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.registeredReporters).toHaveLength(3);
    expect(result.registeredReporters[0]).toEqual(
      expect.objectContaining({
        userId: 'user-001',
        status: 'success',
      })
    );
    expect(result.registeredReporters[1]).toEqual(
      expect.objectContaining({
        userId: 'user-002',
        status: 'success',
      })
    );
    expect(result.registeredReporters[2]).toEqual(
      expect.objectContaining({
        userId: 'user-003',
        status: 'success',
      })
    );

    expect(result.updatedReporters).toHaveLength(2);
    expect(result.updatedReporters[0]).toEqual(
      expect.objectContaining({
        userId: 'user-004',
        status: 'success',
      })
    );
    expect(result.updatedReporters[1]).toEqual(
      expect.objectContaining({
        userId: 'user-005',
        status: 'success',
      })
    );

    expect(result.deactivatedReporters).toHaveLength(1);
    expect(result.deactivatedReporters[0]).toEqual(
      expect.objectContaining({
        userId: 'user-006',
        status: 'success',
      })
    );

    expect(result.changeHistoryRecorded).toBe(true);
    expect(result.leaderNotificationSent).toBe(true);

    expect(result.executionSummary).toContain('登録件数: 3');
    expect(result.executionSummary).toContain('更新件数: 2');
    expect(result.executionSummary).toContain('削除件数: 1');
    expect(result.executionSummary).toContain('エラー件数: 0');
  });

  it('should verify all 6 personnel records are validated', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(inputValidation.validateUserInformationRequired).toHaveBeenCalledTimes(6);
    expect(inputValidation.detectDuplicateEmailAddress).toHaveBeenCalledTimes(3);
  });

  it('should call registerReporter for all 3 new hire records', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(reporterMgt.registerReporter).toHaveBeenCalledTimes(3);
    expect(reporterMgt.registerReporter).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-001' })
    );
    expect(reporterMgt.registerReporter).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-002' })
    );
    expect(reporterMgt.registerReporter).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-003' })
    );
  });

  it('should call updateReporter for all 2 transfer records', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(reporterMgt.updateReporter).toHaveBeenCalledTimes(2);
    expect(reporterMgt.updateReporter).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-004' })
    );
    expect(reporterMgt.updateReporter).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-005' })
    );
  });

  it('should call deactivateReporter for the retirement record', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(reporterMgt.deactivateReporter).toHaveBeenCalledTimes(1);
    expect(reporterMgt.deactivateReporter).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-006' })
    );
  });

  it('should call registerReporterToMaster for all 3 new hire records', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(userMasterPersist.registerReporterToMaster).toHaveBeenCalledTimes(3);
  });

  it('should call updateReporterInMaster for all 2 transfer records', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(userMasterPersist.updateReporterInMaster).toHaveBeenCalledTimes(2);
  });

  it('should call deactivateReporterInMaster for the retirement record', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(userMasterPersist.deactivateReporterInMaster).toHaveBeenCalledTimes(1);
  });

  it('should call persistReporterMasterChangeHistory for all 6 records', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(userMasterPersist.persistReporterMasterChangeHistory).toHaveBeenCalledTimes(6);
  });

  it('should exceed AIVIC goal constraint of 5 people with 6 total operations', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(input, mockAiClient);

    const totalChanges =
      result.registeredReporters.length +
      result.updatedReporters.length +
      result.deactivatedReporters.length;

    expect(totalChanges).toBe(6);
    expect(totalChanges).toBeGreaterThan(5);
  });

  it('should not throw PersonnelMovementDataNotFound error when processing 6 records', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await expect(runTx7Imp1Agent(input, mockAiClient)).resolves.toBeDefined();
  });

  it('should call sendUserInformationApprovalNotification for all 6 records', async () => {
    const input: Tx7Imp1AgentInput = {
      personnelMovementData: allRecords,
      executionTimestamp: now,
    };

    await runTx7Imp1Agent(input, mockAiClient);

    expect(emailNotif.sendUserInformationApprovalNotification).toHaveBeenCalledTimes(6);
  });
});
