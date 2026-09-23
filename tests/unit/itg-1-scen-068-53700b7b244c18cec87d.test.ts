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
  UserInformationValidationError,
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

// 人事異動に伴う4件: 新入社員配置、部門異動、退職、プロジェクト配置変更(role変更)。
const NEW_EMPLOYEE = {
  userId: "USER_NEW",
  userName: "新人一郎",
  email: "shinjin@example.com",
  department: "営業部",
  role: "reporter",
  status: "new",
};
const TRANSFERRED = {
  userId: "USER_TRANSFER",
  userName: "異動次郎",
  email: "idou@example.com",
  department: "開発部",
  role: "reporter",
  status: "transferred",
};
const RETIRED = {
  userId: "USER_RETIRE",
  userName: "退職三郎",
  email: "taishoku@example.com",
  department: "総務部",
  role: "reporter",
  status: "inactive",
};
const ROLE_CHANGED = {
  userId: "USER_ROLECHANGE",
  userName: "配置四郎",
  email: "haichi@example.com",
  department: "開発部",
  role: "project_lead",
  status: "role_changed",
};

const USERS = [NEW_EMPLOYEE, TRANSFERRED, RETIRED, ROLE_CHANGED];
const APPROVED_USER_IDS = ["USER_NEW", "USER_TRANSFER", "USER_ROLECHANGE"];
const UPDATE_USER_IDS = ["USER_TRANSFER", "USER_ROLECHANGE"];

describe("SCEN-068: 人事異動・新入社員配置・退職異動・プロジェクト配置変更により報告者マスタ更新が必要な場合、エージェントが登録・更新・非活性化を実行しリーダー判断を要する例外ケースとして出力に記録される", () => {
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

    // 新入社員・異動者・配置変更者の3件は承認、退職者の1件は却下。
    mockedConfirmAndApproveUserInformation.mockImplementation((input: any) =>
      Promise.resolve({
        userId: input.userId,
        approvalDecision: APPROVED_USER_IDS.includes(input.userId)
          ? "approve"
          : "reject",
        approvedAt: executionTimestamp,
      })
    );

    mockedRegisterReporter.mockImplementation((input: any) =>
      input.userId === "USER_NEW"
        ? Promise.resolve({ userId: input.userId, registered: true })
        : Promise.reject(new Error(`unexpected registerReporter call for ${input.userId}`))
    );

    mockedUpdateReporter.mockImplementation((input: any) =>
      UPDATE_USER_IDS.includes(input.userId)
        ? Promise.resolve({ userId: input.userId, updated: true })
        : Promise.reject(new Error(`unexpected updateReporter call for ${input.userId}`))
    );

    mockedDeactivateReporter.mockImplementation((input: any) =>
      input.userId === "USER_RETIRE"
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

    // 新規登録された3名(新入社員・異動者・配置変更者)が対象営業日の未提出者として検知される。
    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [NEW_EMPLOYEE, TRANSFERRED, ROLE_CHANGED].map((u) => ({
        userId: u.userId,
        userName: u.userName,
        emailAddress: u.email,
      })),
      detectedCount: 3,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      logs: [NEW_EMPLOYEE, TRANSFERRED, ROLE_CHANGED].map((u) => ({
        userId: u.userId,
        detectedAt: executionTimestamp,
      })),
      count: 3,
    });
  });

  it("承認3件・却下1件、報告者マスタの登録・更新・非活性化が実行され、人事異動ケースがリーダー判断を要する例外案件として記録される", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: USERS,
      executionTimestamp,
      targetDate,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input);

    expect(result.executionStatus).toBe("success");

    expect(result.userInformationProcessingResult).toEqual({
      approved: 3,
      rejected: 1,
      errors: [],
    });

    expect(result.reporterMasterUpdateResult).toEqual({
      registered: 1,
      updated: 2,
      deactivated: 1,
      errors: [],
    });

    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(3);
    expect(result.notificationSendingResult.failedNotifications).toEqual([]);

    expect(result.nonSubmissionDetectionResult).toEqual({
      detectedCount: 3,
      promptedCount: 3,
      errors: [],
    });

    // 人事異動による報告者マスタ更新ケースが例外案件として記録されていること。
    expect(result.exceptionCases).toHaveLength(3);

    const caseIds = new Set(
      result.exceptionCases.map((exceptionCase: any) => exceptionCase.caseId)
    );
    expect(caseIds.size).toBe(3);

    const newEmployeeCase = result.exceptionCases.find((exceptionCase: any) =>
      exceptionCase.description.includes("新入社員")
    );
    expect(newEmployeeCase).toBeDefined();
    expect(newEmployeeCase.requiredLeaderAction).toContain("初期日報提出期限確認");

    const transferCase = result.exceptionCases.find((exceptionCase: any) =>
      exceptionCase.description.includes("異動")
    );
    expect(transferCase).toBeDefined();
    expect(transferCase.requiredLeaderAction).toContain("部門間引き継ぎ確認");

    const roleChangeCase = result.exceptionCases.find((exceptionCase: any) =>
      exceptionCase.description.includes("配置変更") ||
      exceptionCase.description.includes("プロジェクト")
    );
    expect(roleChangeCase).toBeDefined();
    expect(roleChangeCase.requiredLeaderAction).toContain("プロジェクト開始日確認");

    // validateUserInformationRequiredとdetectDuplicateEmailAddressの検証成功、
    // UserInformationValidationErrorが発生しなかったことが記録されている。
    expect(mockedValidateUserInformationRequired).toHaveBeenCalled();
    expect(mockedDetectDuplicateEmailAddress).toHaveBeenCalled();
    expect(typeof result.executionLog).toBe("string");
    expect(result.executionLog.length).toBeGreaterThan(0);
    expect(result.executionLog).not.toMatch(
      new RegExp(UserInformationValidationError.name)
    );
  });
});
