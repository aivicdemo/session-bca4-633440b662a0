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

import {
  runTx6Imp1Agent,
  UserInformationValidationError,
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
} from "../../src/logic/user-information-input-confirmation";
import { registerReporter } from "../../src/logic/reporter-master-management";
import { sendUserInformationApprovalNotification } from "../../src/logic/email-notification-management";

const mockedAuthenticateAndAuthorizeLeaderAccess =
  authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedValidateUserInformationRequired =
  validateUserInformationRequired as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedSubmitUserInformationForConfirmation =
  submitUserInformationForConfirmation as jest.Mock;
const mockedConfirmAndApproveUserInformation =
  confirmAndApproveUserInformation as jest.Mock;
const mockedRegisterReporter = registerReporter as jest.Mock;
const mockedSendUserInformationApprovalNotification =
  sendUserInformationApprovalNotification as jest.Mock;

describe("SCEN-062: 提出ユーザー情報に必須項目不足・形式不正・重複メールアドレスが含まれる場合、処理が中断しUserInformationValidationErrorが発生する", () => {
  const leaderUserId = "LEADER001";
  const executionTimestamp = new Date("2024-01-15T17:00:00+09:00");
  const targetDate = new Date("2024-01-15T00:00:00+09:00");

  // (1) 必須項目不足: userIdのみ指定
  const missingFieldsUser = {
    userId: "USER001",
    userName: null,
    email: null,
    department: null,
    role: null,
  };
  // (2) 形式不正: emailに'@'を含まない
  const invalidFormatUser = {
    userId: "USER002",
    userName: "佐藤花子",
    email: "sato-example.com",
    department: "営業部",
    role: "reporter",
  };
  // (3) 重複メールアドレス: 同じemail値を持つ2件以上のレコード
  const duplicateEmailUserA = {
    userId: "USER003",
    userName: "鈴木一郎",
    email: "duplicate@example.com",
    department: "開発部",
    role: "reporter",
  };
  const duplicateEmailUserB = {
    userId: "USER004",
    userName: "田中次郎",
    email: "duplicate@example.com",
    department: "開発部",
    role: "reporter",
  };

  const userInformationSubmissions = [
    missingFieldsUser,
    invalidFormatUser,
    duplicateEmailUserA,
    duplicateEmailUserB,
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthenticated: true,
      isAuthorized: true,
      leaderUserId,
    });

    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: false,
      errors: [
        { userId: "USER001", reason: "名前は1文字以上で入力してください。" },
        { userId: "USER001", reason: "メールアドレスは必須項目です。" },
        { userId: "USER002", reason: "メールアドレスの形式が正しくありません。" },
      ],
    });

    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      hasDuplicate: true,
      duplicateEmails: ["duplicate@example.com"],
    });

    mockedSubmitUserInformationForConfirmation.mockResolvedValue({});
    mockedConfirmAndApproveUserInformation.mockResolvedValue({});
    mockedRegisterReporter.mockResolvedValue({});
    mockedSendUserInformationApprovalNotification.mockResolvedValue({});
  });

  it("UserInformationValidationErrorが発生し、以降の処理は実行されない", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    await expect(runTx6Imp1Agent(input)).rejects.toThrow(
      UserInformationValidationError
    );
    await expect(runTx6Imp1Agent(input)).rejects.toThrow(
      "ユーザー情報の検証に失敗しました。必須項目の確認と形式を修正してください。"
    );

    expect(mockedValidateUserInformationRequired).toHaveBeenCalled();
    expect(mockedDetectDuplicateEmailAddress).toHaveBeenCalled();

    expect(mockedSubmitUserInformationForConfirmation).not.toHaveBeenCalled();
    expect(mockedConfirmAndApproveUserInformation).not.toHaveBeenCalled();
    expect(mockedRegisterReporter).not.toHaveBeenCalled();
    expect(mockedSendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
