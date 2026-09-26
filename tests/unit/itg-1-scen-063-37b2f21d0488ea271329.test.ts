import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx6Imp1Agent,
  type Tx6Imp1AiClient,
  type Tx6Imp1AgentInput,
  type Tx6Imp1AgentOutput,
  UserInformationApprovalTimeoutError,
} from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-063: ユーザー情報の承認期限を超過した場合、処理が中断しUserInformationApprovalTimeoutErrorが発生する', () => {
  let mockAiClient: Tx6Imp1AiClient;
  let executionTimestamp: Date;
  let targetDate: Date;
  let leaderUserId: string;
  let userInformationSubmissions: Array<{
    userId: string;
    userName: string;
    email: string;
    department: string;
    role: string;
  }>;

  beforeEach(() => {
    leaderUserId = 'leader001';
    executionTimestamp = new Date('2024-01-15T18:00:00+09:00');
    targetDate = new Date('2024-01-15T00:00:00+09:00');

    userInformationSubmissions = [
      {
        userId: 'user001',
        userName: 'ユーザー1',
        email: 'user001@example.com',
        department: '営業部',
        role: '営業',
      },
      {
        userId: 'user002',
        userName: 'ユーザー2',
        email: 'user002@example.com',
        department: '企画部',
        role: '企画',
      },
      {
        userId: 'user003',
        userName: 'ユーザー3',
        email: 'user003@example.com',
        department: '開発部',
        role: '開発',
      },
      {
        userId: 'user004',
        userName: 'ユーザー4',
        email: 'user004@example.com',
        department: '総務部',
        role: '管理',
      },
      {
        userId: 'user005',
        userName: 'ユーザー5',
        email: 'user005@example.com',
        department: '営業部',
        role: '営業',
      },
    ];

    // authenticateAndAuthorizeLeaderAccess のスタブ
    const authenticateStub = (jest.fn() as any).mockResolvedValue({
      isAuthenticated: true,
      isAuthorized: true,
      userId: leaderUserId,
    });

    // validateUserInformationRequired のスタブ
    const validateUserInfoStub = (jest.fn() as any).mockResolvedValue({
      isValid: true,
      validationResults: {
        requiredFieldsPresent: true,
        formatValid: true,
      },
    });

    // detectDuplicateEmailAddress のスタブ
    const detectDuplicateStub = (jest.fn() as any).mockResolvedValue({
      hasDuplicates: false,
      duplicates: [],
    });

    // submitUserInformationForConfirmation のスタブ
    const submitUserInfoStub = (jest.fn() as any).mockResolvedValue({
      submissionId: 'submission-001',
      submittedAt: executionTimestamp.toISOString(),
      status: 'submitted',
    });

    // confirmAndApproveUserInformation のスタブ - 承認期限超過を返す
    const confirmAndApproveStub = (jest.fn() as any).mockResolvedValue({
      isApproved: false,
      approvalStatus: 'timeout',
      timeoutReason: 'Approval deadline exceeded',
      timedOutAt: executionTimestamp.toISOString(),
    });

    mockAiClient = {
      authenticateAndAuthorizeLeaderAccess: authenticateStub,
      validateUserInformationRequired: validateUserInfoStub,
      detectDuplicateEmailAddress: detectDuplicateStub,
      submitUserInformationForConfirmation: submitUserInfoStub,
      confirmAndApproveUserInformation: confirmAndApproveStub,
      retrieveUserInformationConfirmationStatus: (jest.fn() as any).mockResolvedValue({
        confirmed: false,
        approvalStatus: 'timeout',
      }),
      registerReporter: jest.fn(),
      updateReporter: jest.fn(),
      deactivateReporter: jest.fn(),
      sendApprovalNotification: jest.fn(),
      detectNonSubmittedReportersAtDeadline: jest.fn(),
      sendNonSubmissionPromptNotification: jest.fn(),
    };
  });

  it('承認期限超過時に UserInformationApprovalTimeoutError が発生する', async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    await expect(runTx6Imp1Agent(input, mockAiClient)).rejects.toThrow(
      UserInformationApprovalTimeoutError
    );
  });

  it('エラーメッセージが正しい内容を含む', async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    try {
      await runTx6Imp1Agent(input, mockAiClient);
      fail('UserInformationApprovalTimeoutError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UserInformationApprovalTimeoutError);
      expect((error as Error).message).toContain('承認期限を超過しました');
      expect((error as Error).message).toContain('リーダーによる確認が必要です');
    }
  });

  it('承認期限超過後の処理（reporterMasterUpdateResult等）は実行されない', async () => {
    const registerReporterSpy = jest.fn();
    const updateReporterSpy = jest.fn();
    const detectNonSubmittedSpy = jest.fn();
    const sendNonSubmissionSpy = jest.fn();

    mockAiClient.registerReporter = registerReporterSpy;
    mockAiClient.updateReporter = updateReporterSpy;
    mockAiClient.detectNonSubmittedReportersAtDeadline = detectNonSubmittedSpy;
    mockAiClient.sendNonSubmissionPromptNotification = sendNonSubmissionSpy;

    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    try {
      await runTx6Imp1Agent(input, mockAiClient);
    } catch (error) {
      // エラーが発生することは期待通り
    }

    expect(registerReporterSpy).not.toHaveBeenCalled();
    expect(updateReporterSpy).not.toHaveBeenCalled();
    expect(detectNonSubmittedSpy).not.toHaveBeenCalled();
    expect(sendNonSubmissionSpy).not.toHaveBeenCalled();
  });
});
