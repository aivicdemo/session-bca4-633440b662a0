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

// 有効な3件。
const VALID_USER_A = {
  userId: "USER_VALID_A",
  userName: "山田太郎",
  email: "yamada@example.com",
  department: "営業部",
  role: "reporter",
};
const VALID_USER_B = {
  userId: "USER_VALID_B",
  userName: "佐藤花子",
  email: "sato@example.com",
  department: "営業部",
  role: "reporter",
};
const VALID_USER_C = {
  userId: "USER_VALID_C",
  userName: "鈴木一郎",
  email: "suzuki@example.com",
  department: "開発部",
  role: "reporter",
};

// 無効な2件: 必須項目不足(userName欠落)とメールアドレス重複。
const INVALID_USER_MISSING_FIELD = {
  userId: "USER_INVALID_MISSING",
  userName: "",
  email: "missing@example.com",
  department: "総務部",
  role: "reporter",
};
const INVALID_USER_DUPLICATE_A = {
  userId: "USER_INVALID_DUP_A",
  userName: "田中次郎",
  email: "duplicate@example.com",
  department: "総務部",
  role: "reporter",
};

const VALID_USERS = [VALID_USER_A, VALID_USER_B, VALID_USER_C];
const INVALID_USERS = [INVALID_USER_MISSING_FIELD, INVALID_USER_DUPLICATE_A];
const ALL_USERS = [...VALID_USERS, ...INVALID_USERS];

describe("SCEN-069: 一部のユーザー情報処理は成功し一部は失敗した場合、executionStatusが「partial_failure」となり各工程の成功・失敗件数が出力に含まれる", () => {
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

    // 5件すべてに対して検証が行われ、3件成功・2件失敗を返す。
    mockedValidateUserInformationRequired.mockResolvedValue({
      isValid: false,
      errors: [
        {
          userId: INVALID_USER_MISSING_FIELD.userId,
          reason: "名前は1文字以上で入力してください。",
        },
        {
          userId: INVALID_USER_DUPLICATE_A.userId,
          reason: "このメールアドレスは既に登録されています。",
        },
      ],
    });

    // 2件のメールアドレス重複を検知する。
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      hasDuplicate: true,
      duplicateEmails: [INVALID_USER_DUPLICATE_A.email],
      duplicateCount: 2,
    });

    // 有効な3件に対してのみ提出処理が呼び出される。
    mockedSubmitUserInformationForConfirmation.mockImplementation((input: any) => {
      if (!VALID_USERS.some((u) => u.userId === input.userId)) {
        return Promise.reject(
          new Error(`unexpected submitUserInformationForConfirmation call for ${input.userId}`)
        );
      }
      return Promise.resolve({
        userInformationId: `CONF-${input.userId}`,
        userId: input.userId,
        status: "pending_confirmation",
      });
    });

    // 3件すべてが承認される。
    mockedConfirmAndApproveUserInformation.mockImplementation((input: any) =>
      Promise.resolve({
        userId: input.userId,
        approvalDecision: "approve",
        approvedAt: executionTimestamp,
      })
    );

    // br-tx_7-001に基づき、3件の報告者マスタ操作(登録2件・更新1件)が実行される。
    mockedRegisterReporter.mockImplementation((input: any) =>
      [VALID_USER_A.userId, VALID_USER_B.userId].includes(input.userId)
        ? Promise.resolve({ userId: input.userId, registered: true })
        : Promise.reject(new Error(`unexpected registerReporter call for ${input.userId}`))
    );
    mockedUpdateReporter.mockImplementation((input: any) =>
      input.userId === VALID_USER_C.userId
        ? Promise.resolve({ userId: input.userId, updated: true })
        : Promise.reject(new Error(`unexpected updateReporter call for ${input.userId}`))
    );
    mockedDeactivateReporter.mockImplementation((input: any) =>
      Promise.reject(new Error(`unexpected deactivateReporter call for ${input.userId}`))
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

  it("executionStatusが'partial_failure'となり、各工程の成功・失敗件数が出力される", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: ALL_USERS,
      executionTimestamp,
      targetDate,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_failure");

    expect(result.userInformationProcessingResult.approved).toBe(3);
    expect(result.userInformationProcessingResult.rejected).toBe(0);
    expect(result.userInformationProcessingResult.errors).toHaveLength(2);
    const errorUserIds = result.userInformationProcessingResult.errors.map(
      (e: any) => e.userId
    );
    expect(errorUserIds.sort()).toEqual(
      [INVALID_USER_MISSING_FIELD.userId, INVALID_USER_DUPLICATE_A.userId].sort()
    );
    result.userInformationProcessingResult.errors.forEach((e: any) => {
      expect(typeof e.reason).toBe("string");
      expect(e.reason.length).toBeGreaterThan(0);
    });

    expect(
      result.reporterMasterUpdateResult.registered +
        result.reporterMasterUpdateResult.updated +
        result.reporterMasterUpdateResult.deactivated
    ).toBe(3);
    expect(result.reporterMasterUpdateResult.errors).toEqual([]);

    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(3);
    expect(result.notificationSendingResult.failedNotifications).toEqual([]);

    expect(result.nonSubmissionDetectionResult.detectedCount).toBeGreaterThanOrEqual(0);
    expect(result.nonSubmissionDetectionResult.promptedCount).toBeGreaterThanOrEqual(0);
    expect(result.nonSubmissionDetectionResult.errors).toEqual([]);

    expect(result.exceptionCases).toEqual([]);

    expect(typeof result.executionLog).toBe("string");
    expect(result.executionLog).toMatch(new RegExp(INVALID_USER_MISSING_FIELD.userId));
    expect(result.executionLog).toMatch(new RegExp(INVALID_USER_DUPLICATE_A.userId));
    expect(result.executionLog).toMatch(new RegExp(VALID_USER_A.userId));
    expect(result.executionLog).toMatch(new RegExp(VALID_USER_B.userId));
    expect(result.executionLog).toMatch(new RegExp(VALID_USER_C.userId));

    expect(mockedValidateUserInformationRequired).toHaveBeenCalled();
    expect(mockedDetectDuplicateEmailAddress).toHaveBeenCalled();
    expect(mockedSubmitUserInformationForConfirmation).toHaveBeenCalledTimes(3);
    expect(mockedConfirmAndApproveUserInformation).toHaveBeenCalledTimes(3);
  });
});
