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
  EmailNotificationFailureError,
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

const USERS = [
  { userId: "USER001", userName: "山田太郎", email: "yamada@example.com", department: "営業部", role: "reporter" },
  { userId: "USER002", userName: "佐藤花子", email: "sato@example.com", department: "営業部", role: "reporter" },
  { userId: "USER003", userName: "鈴木一郎", email: "suzuki@example.com", department: "開発部", role: "reporter" },
  { userId: "USER004", userName: "田中次郎", email: "tanaka@example.com", department: "開発部", role: "reporter" },
  { userId: "USER005", userName: "高橋三郎", email: "takahashi@example.com", department: "総務部", role: "reporter" },
];

describe("SCEN-064: 承認済みユーザー情報をメール送信できない場合、EmailNotificationFailureErrorが発生し出力に失敗通知が含まれる", () => {
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

    // 報告者マスタ登録は5件すべて成功する。
    mockedRegisterReporter.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, registered: true })
    );
    mockedUpdateReporter.mockResolvedValue({});
    mockedDeactivateReporter.mockResolvedValue({});
    mockedRegisterReporterToMaster.mockImplementation((input: any) =>
      Promise.resolve({ userId: input.userId, persisted: true })
    );
    mockedUpdateReporterInMaster.mockResolvedValue({});
    mockedDeactivateReporterInMaster.mockResolvedValue({});

    // 承認通知: 最初の3件は成功、4件目の送信でEmailNotificationFailureErrorを発生させる。
    mockedSendUserInformationApprovalNotification
      .mockResolvedValueOnce({ success: true, email: USERS[0].email })
      .mockResolvedValueOnce({ success: true, email: USERS[1].email })
      .mockResolvedValueOnce({ success: true, email: USERS[2].email })
      .mockRejectedValueOnce(
        new EmailNotificationFailureError(
          "ユーザー情報承認通知メールの送信に失敗しました。再送信を試みてください。"
        )
      );

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [],
      detectedCount: 0,
    });
    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
    });
  });

  it("executionStatusがpartial_failureとなり、4件目のユーザーの承認通知失敗がfailedNotificationsに記録される", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: USERS,
      executionTimestamp,
      targetDate,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input);

    expect(result.executionStatus).toBe("partial_failure");

    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(3);
    expect(result.notificationSendingResult.failedNotifications).toHaveLength(1);
    expect(result.notificationSendingResult.failedNotifications[0]).toEqual(
      expect.objectContaining({
        userId: USERS[3].userId,
        type: "approval_notification",
        reason:
          "ユーザー情報承認通知メールの送信に失敗しました。再送信を試みてください。",
      })
    );

    expect(result.userInformationProcessingResult.approved).toBe(5);
    expect(result.userInformationProcessingResult.errors).toEqual([]);

    expect(result.reporterMasterUpdateResult.registered).toBe(5);
    expect(result.reporterMasterUpdateResult.errors).toEqual([]);

    expect(result.nonSubmissionDetectionResult.errors).toEqual([]);

    expect(result.exceptionCases).toEqual([]);

    expect(result.executionLog).toMatch(/EmailNotificationFailureError/);
    expect(result.executionLog).toMatch(new RegExp(USERS[3].userId));
  });
});
