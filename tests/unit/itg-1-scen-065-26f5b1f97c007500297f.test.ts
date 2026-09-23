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
import { sendUserInformationApprovalNotification } from "../../src/logic/email-notification-management";
import { detectNonSubmittedReportersAtDeadline } from "../../src/logic/daily-report-non-submission-detection";
import { sendLeaderNonSubmissionPromptNotification } from "../../src/logic/daily-report-reminder-notification";

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
const mockedSendUserInformationApprovalNotification =
  sendUserInformationApprovalNotification as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline =
  detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification =
  sendLeaderNonSubmissionPromptNotification as jest.Mock;

const USERS = [
  { userId: "USER001", userName: "山田太郎", email: "yamada@example.com", department: "営業部", role: "reporter" },
  { userId: "USER002", userName: "佐藤花子", email: "sato@example.com", department: "営業部", role: "reporter" },
  { userId: "USER003", userName: "鈴木一郎", email: "suzuki@example.com", department: "開発部", role: "reporter" },
];

describe("SCEN-065: 報告者マスタの登録・更新・削除処理が失敗した場合、ReporterMasterUpdateErrorが発生し出力にエラー理由が含まれる", () => {
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
      Promise.resolve({ userInformationId: `CONF-${input.userId}`, userId: input.userId })
    );
    mockedConfirmAndApproveUserInformation.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, approvalDecision: "approve" })
    );
    mockedRetrieveUserInformationConfirmationStatus.mockResolvedValue({
      confirmations: USERS.map((u) => ({ userId: u.userId, status: "approved" })),
      allApproved: true,
    });

    // registerReporterでuserId='USER001'の登録時にデータベース接続失敗が発生する。
    mockedRegisterReporter.mockImplementation((input: any) => {
      if (input.userId === "USER001") {
        return Promise.reject(new Error("データベース接続失敗"));
      }
      return Promise.resolve({ userId: input.userId, registered: true });
    });
    mockedUpdateReporter.mockResolvedValue({});
    mockedDeactivateReporter.mockResolvedValue({});

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
  });

  it("reporterMasterUpdateResult.errorsに設計済みエラー文言が含まれ、executionStatusがpartial_failureまたはfailureとなる", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: USERS,
      executionTimestamp,
      targetDate,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input);

    expect(["partial_failure", "failure"]).toContain(result.executionStatus);

    expect(result.reporterMasterUpdateResult.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.reporterMasterUpdateResult.errors[0]).toEqual(
      expect.objectContaining({
        userId: "USER001",
      })
    );
    expect(result.reporterMasterUpdateResult.errors[0].reason).toContain(
      "報告者マスタの更新に失敗しました。システム管理者に確認してください。"
    );
  });
});
