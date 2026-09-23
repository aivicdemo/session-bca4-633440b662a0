jest.mock("../../src/logic/user-authentication-authorization", () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock("../../src/logic/input-validation-formatting", () => ({
  validateUserInformationRequired: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));
jest.mock("../../src/logic/user-information-input-confirmation", () => ({
  submitUserInformationForConfirmation: jest.fn(),
  confirmAndApproveUserInformation: jest.fn(),
  retrieveUserInformationConfirmationStatus: jest.fn(),
}));
jest.mock("../../src/logic/reporter-master-management", () => ({
  registerReporter: jest.fn(),
  updateReporter: jest.fn(),
  deactivateReporter: jest.fn(),
}));
jest.mock("../../src/logic/user-master-persistence", () => ({
  registerReporterToMaster: jest.fn(),
  updateReporterInMaster: jest.fn(),
  deactivateReporterInMaster: jest.fn(),
}));
jest.mock("../../src/logic/email-notification-management", () => ({
  sendUserInformationApprovalNotification: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-non-submission-detection", () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-reminder-notification", () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock("../../src/logic/daily-report-persistence", () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

import {
  runTx6Imp1Agent,
  Tx6Imp1AgentInput,
  Tx6Imp1AgentOutput,
} from "../../src/agents/tx-6-imp-1/orchestrator";
import { authenticateAndAuthorizeLeaderAccess } from "../../src/logic/user-authentication-authorization";
import {
  validateUserInformationRequired,
  detectDuplicateEmailAddress,
} from "../../src/logic/input-validation-formatting";
import {
  submitUserInformationForConfirmation,
  confirmAndApproveUserInformation,
  retrieveUserInformationConfirmationStatus,
} from "../../src/logic/user-information-input-confirmation";
import {
  registerReporter,
  updateReporter,
  deactivateReporter,
} from "../../src/logic/reporter-master-management";
import {
  registerReporterToMaster,
  updateReporterInMaster,
  deactivateReporterInMaster,
} from "../../src/logic/user-master-persistence";
import { sendUserInformationApprovalNotification } from "../../src/logic/email-notification-management";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";
import { sendLeaderNonSubmissionPromptNotification } from "../../src/logic/daily-report-reminder-notification";
import { retrieveNonSubmissionDetectionLogsByDate } from "../../src/logic/daily-report-persistence";

const mockedAuthenticateAndAuthorizeLeaderAccess =
  authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedValidateUserInformationRequired =
  validateUserInformationRequired as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedSubmitUserInformationForConfirmation =
  submitUserInformationForConfirmation as jest.Mock;
const mockedConfirmAndApproveUserInformation =
  confirmAndApproveUserInformation as jest.Mock;
const mockedRetrieveUserInformationConfirmationStatus =
  retrieveUserInformationConfirmationStatus as jest.Mock;
const mockedRegisterReporter = registerReporter as jest.Mock;
const mockedUpdateReporter = updateReporter as jest.Mock;
const mockedDeactivateReporter = deactivateReporter as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedUpdateReporterInMaster = updateReporterInMaster as jest.Mock;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;
const mockedSendUserInformationApprovalNotification =
  sendUserInformationApprovalNotification as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline =
  detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification =
  sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveNonSubmissionDetectionLogsByDate =
  retrieveNonSubmissionDetectionLogsByDate as jest.Mock;

// AIVICゴール制約: メンテナンス系の機能は報告者となるユーザーマスタのみ。
const USERS = [
  { userId: "USER001", userName: "山田太郎", email: "yamada@example.com", department: "営業部", role: "reporter" },
  { userId: "USER002", userName: "佐藤花子", email: "sato@example.com", department: "営業部", role: "reporter" },
  { userId: "USER003", userName: "鈴木一郎", email: "suzuki@example.com", department: "開発部", role: "reporter" },
  { userId: "USER004", userName: "田中次郎", email: "tanaka@example.com", department: "開発部", role: "reporter" },
  { userId: "USER005", userName: "高橋三郎", email: "takahashi@example.com", department: "総務部", role: "reporter" },
];

// USER001, USER002は新規登録。USER003, USER004は既存更新。USER005は非活性化対象。
const NEW_USER_IDS = ["USER001", "USER002"];
const UPDATE_USER_IDS = ["USER003", "USER004"];
const DEACTIVATE_USER_IDS = ["USER005"];

describe("SCEN-061: リーダーが正規ユーザー情報をエージェントに提出し、全工程（検証・承認・メール通知・未提出者催促）が正常に完了する", () => {
  const leaderUserId = "LEADER001";
  const executionTimestamp = new Date("2024-01-15T17:00:00+09:00");
  const targetDate = new Date("2024-01-15T00:00:00+09:00");

  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthenticated: true,
      isAuthorized: true,
      leaderUserId,
    });

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: true,
      errors: [],
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      hasDuplicate: false,
      duplicateEmails: [],
    });

    mockedSubmitUserInformationForConfirmation.mockImplementation((input: any) =>
      Promise.resolve({
        userInformationId: `CONF-${input.userId}`,
        userId: input.userId,
        status: "pending_confirmation",
      })
    );

    mockedConfirmAndApproveUserInformation.mockImplementation((input: any) =>
      Promise.resolve({
        userId: input.userId,
        approvalDecision: "approve",
        approvedAt: executionTimestamp,
      })
    );

    mockedRetrieveUserInformationConfirmationStatus.mockResolvedValue({
      confirmations: USERS.map((u) => ({ userId: u.userId, status: "approved" })),
      allApproved: true,
    });

    mockedRegisterReporter.mockImplementation((input: any) =>
      NEW_USER_IDS.includes(input.userId)
        ? Promise.resolve({ userId: input.userId, registered: true })
        : Promise.reject(new Error(`unexpected registerReporter call for ${input.userId}`))
    );

    mockedUpdateReporter.mockImplementation((input: any) =>
      UPDATE_USER_IDS.includes(input.userId)
        ? Promise.resolve({ userId: input.userId, updated: true })
        : Promise.reject(new Error(`unexpected updateReporter call for ${input.userId}`))
    );

    mockedDeactivateReporter.mockImplementation((input: any) =>
      DEACTIVATE_USER_IDS.includes(input.userId)
        ? Promise.resolve({ userId: input.userId, deactivated: true })
        : Promise.reject(new Error(`unexpected deactivateReporter call for ${input.userId}`))
    );

    mockedRegisterReporterToMaster.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, persisted: true })
    );
    mockedUpdateReporterInMaster.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, persisted: true })
    );
    mockedDeactivateReporterInMaster.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, persisted: true })
    );

    mockedSendUserInformationApprovalNotification.mockImplementation((input: any) =>
      Promise.resolve({ success: true, email: input.email })
    );

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [],
      detectedCount: 0,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      logs: [],
      count: 0,
    });
  });

  it("全工程が正常完了し、承認5件・登録2件・更新2件・非活性化1件・エラーなしの結果が返る", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: USERS,
      executionTimestamp,
      targetDate,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input);

    expect(result.executionStatus).toBe("success");

    expect(result.userInformationProcessingResult).toEqual({
      approved: 5,
      rejected: 0,
      errors: [],
    });

    expect(result.reporterMasterUpdateResult).toEqual({
      registered: 2,
      updated: 2,
      deactivated: 1,
      errors: [],
    });

    expect(result.nonSubmissionDetectionResult.detectedCount).toBeGreaterThanOrEqual(0);
    expect(result.nonSubmissionDetectionResult.promptedCount).toBeGreaterThanOrEqual(0);
    expect(result.nonSubmissionDetectionResult.errors).toEqual([]);

    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(5);
    expect(result.notificationSendingResult.promptNotificationsSent).toBeGreaterThanOrEqual(0);
    expect(result.notificationSendingResult.failedNotifications).toEqual([]);

    expect(result.exceptionCases).toEqual([]);
    expect(typeof result.executionLog).toBe("string");
    expect(result.executionLog.length).toBeGreaterThan(0);

    // 承認通知5件が5名全員のemailフィールド値宛に送信されていること。
    const notifiedEmails = mockedSendUserInformationApprovalNotification.mock.calls.map(
      (call) => call[0].email
    );
    expect(notifiedEmails.sort()).toEqual(USERS.map((u) => u.email).sort());

    // ユーザーマスタに新規2名の登録、既存2名の更新、1名の非活性化が反映されていること。
    expect(mockedRegisterReporterToMaster).toHaveBeenCalledTimes(2);
    expect(mockedUpdateReporterInMaster).toHaveBeenCalledTimes(2);
    expect(mockedDeactivateReporterInMaster).toHaveBeenCalledTimes(1);
  });
});
