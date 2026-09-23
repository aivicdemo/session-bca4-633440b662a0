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
  SystemIntegrationError,
  Tx6Imp1AgentInput,
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

const USERS = [
  { userId: "USER001", userName: "山田太郎", email: "yamada@example.com", department: "営業部", role: "reporter" },
  { userId: "USER002", userName: "佐藤花子", email: "sato@example.com", department: "営業部", role: "reporter" },
  { userId: "USER003", userName: "鈴木一郎", email: "suzuki@example.com", department: "開発部", role: "reporter" },
  { userId: "USER004", userName: "田中次郎", email: "tanaka@example.com", department: "開発部", role: "reporter" },
  { userId: "USER005", userName: "高橋三郎", email: "takahashi@example.com", department: "総務部", role: "reporter" },
];

const NEW_USER_IDS = ["USER001", "USER002"];
const UPDATE_USER_IDS = ["USER003", "USER004"];
const DEACTIVATE_USER_IDS = ["USER005"];

describe("SCEN-067: メール送信・永続化・認証などの外部サービス連携に失敗した場合、SystemIntegrationErrorが発生する", () => {
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

    mockedRegisterReporter.mockImplementation((input: any) =>
      NEW_USER_IDS.includes(input.userId)
        ? Promise.resolve({ userId: input.userId, registered: true })
        : Promise.resolve({ userId: input.userId })
    );
    mockedUpdateReporter.mockImplementation((input: any) =>
      UPDATE_USER_IDS.includes(input.userId)
        ? Promise.resolve({ userId: input.userId, updated: true })
        : Promise.resolve({ userId: input.userId })
    );
    mockedDeactivateReporter.mockImplementation((input: any) =>
      DEACTIVATE_USER_IDS.includes(input.userId)
        ? Promise.resolve({ userId: input.userId, deactivated: true })
        : Promise.resolve({ userId: input.userId })
    );

    // 報告者マスタへの永続化（登録・更新・非活性化）との外部サービス連携をすべて失敗させる。
    mockedRegisterReporterToMaster.mockRejectedValue(
      new Error("報告者マスタへの永続化に失敗しました。データベースに接続できません。")
    );
    mockedUpdateReporterInMaster.mockRejectedValue(
      new Error("報告者マスタへの永続化に失敗しました。データベースに接続できません。")
    );
    mockedDeactivateReporterInMaster.mockRejectedValue(
      new Error("報告者マスタへの永続化に失敗しました。データベースに接続できません。")
    );

    // ユーザー情報承認通知のメール送信サービスとの連携を失敗させる。
    mockedSendUserInformationApprovalNotification.mockRejectedValue(
      new Error("メール送信サービスへの接続に失敗しました。")
    );

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [],
      detectedCount: 0,
    });

    // 未提出者への自動催促メール送信サービスとの連携を失敗させる。
    mockedSendLeaderNonSubmissionPromptNotification.mockRejectedValue(
      new Error("メール送信サービスへの接続に失敗しました。")
    );

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      logs: [],
      count: 0,
    });
  });

  it("runTx6Imp1AgentからSystemIntegrationErrorがスローされ、指定のエラーメッセージであること", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: USERS,
      executionTimestamp,
      targetDate,
    };

    let thrown: unknown;
    try {
      await runTx6Imp1Agent(input);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(SystemIntegrationError);
    expect((thrown as Error).message).toBe(
      "システム連携エラーが発生しました。後で再試行してください。"
    );
  });
});
