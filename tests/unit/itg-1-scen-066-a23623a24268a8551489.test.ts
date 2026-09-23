import {
  runTx6Imp1Agent,
  NonSubmissionPromptExecutionError,
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

jest.mock("../../src/logic/user-authentication-authorization");
jest.mock("../../src/logic/input-validation-formatting");
jest.mock("../../src/logic/user-information-input-confirmation");
jest.mock("../../src/logic/reporter-master-management");
jest.mock("../../src/logic/user-master-persistence");
jest.mock("../../src/logic/email-notification-management");
jest.mock("../../src/logic/daily-report-non-submission-detection");
jest.mock("../../src/logic/daily-report-reminder-notification");
jest.mock("../../src/logic/daily-report-persistence");

const userInformationSubmissions = [
  {
    userId: "user001",
    userName: "田中太郎",
    email: "tanaka@example.com",
    department: "営業部",
    role: "報告者",
  },
  {
    userId: "user002",
    userName: "鈴木花子",
    email: "suzuki@example.com",
    department: "営業部",
    role: "報告者",
  },
  {
    userId: "user003",
    userName: "佐藤次郎",
    email: "sato@example.com",
    department: "営業部",
    role: "報告者",
  },
  {
    userId: "user004",
    userName: "伊藤美咲",
    email: "ito@example.com",
    department: "営業部",
    role: "報告者",
  },
  {
    userId: "user005",
    userName: "渡辺健一",
    email: "watanabe@example.com",
    department: "営業部",
    role: "報告者",
  },
];

const nonSubmittedReporters = [
  {
    userId: "user003",
    userName: "佐藤次郎",
    emailAddress: "sato@example.com",
    promptPriority: "normal",
  },
  {
    userId: "user004",
    userName: "伊藤美咲",
    emailAddress: "ito@example.com",
    promptPriority: "normal",
  },
  {
    userId: "user005",
    userName: "渡辺健一",
    emailAddress: "watanabe@example.com",
    promptPriority: "normal",
  },
];

describe("SCEN-066: 未提出者への自動催促メール送信に失敗した場合、NonSubmissionPromptExecutionErrorが発生し出力に失敗通知が含まれる", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authenticateAndAuthorizeLeaderAccess as jest.Mock).mockResolvedValue({
      isAccessGranted: true,
      userId: "leader001",
      denialReason: null,
    });

    (validateUserInformationRequired as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedUserName: "検証済み",
      validatedEmailAddress: "検証済み",
      validatedDepartment: "検証済み",
      errorCode: null,
    });

    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: "検証済み",
      errorCode: null,
    });

    (submitUserInformationForConfirmation as jest.Mock).mockResolvedValue({
      success: true,
      userInformationId: "uinfo-001",
      confirmationStatus: "submitted",
      leaderNotificationSent: true,
      approvalDeadline: new Date("2024-01-16T10:00:00Z"),
    });

    (confirmAndApproveUserInformation as jest.Mock).mockResolvedValue({
      success: true,
      approvalDecision: "approve",
      reporterUserId: "user001",
      approvalNotificationSent: true,
      reporterMasterRegistered: true,
      processedTimestamp: new Date("2024-01-15T10:05:00Z"),
    });

    (retrieveUserInformationConfirmationStatus as jest.Mock).mockResolvedValue({
      success: true,
      pendingApprovals: [],
      approvedRecords: [],
      expiredApprovals: [],
      totalCount: userInformationSubmissions.length,
    });

    (registerReporter as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: "reporter-001",
      message: "登録に成功しました。",
      changeHistoryId: "hist-001",
    });

    (updateReporter as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: "reporter-001",
      message: "更新に成功しました。",
      changeHistoryId: "hist-002",
    });

    (deactivateReporter as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: "reporter-001",
      archivedReportCount: 0,
      message: "非活性化に成功しました。",
      changeHistoryId: "hist-003",
    });

    (registerReporterToMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: "reporter-001",
      message: "マスタ登録に成功しました。",
    });

    (updateReporterInMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: "reporter-001",
      message: "マスタ更新に成功しました。",
    });

    (deactivateReporterInMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: "reporter-001",
      message: "マスタ非活性化に成功しました。",
    });

    (sendUserInformationApprovalNotification as jest.Mock).mockResolvedValue({
      success: true,
      emailSendingHistoryId: "email-hist-001",
      sentAt: "2024-01-15T10:06:00Z",
      errorMessage: null,
      adminNotificationSent: true,
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      nonSubmittedReporters,
      detectionLog: {
        detectionLogId: "det-log-001",
        detectionDateTime: "2024-01-15T10:00:00Z",
        targetDate: "2024-01-15",
        nonSubmittedCount: nonSubmittedReporters.length,
      },
      detectionTimestamp: "2024-01-15T10:00:00Z",
    });

    // 未提出者への自動催促メール送信に失敗し、NonSubmissionPromptExecutionErrorがスローされる。
    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockImplementation(
      () => {
        throw new NonSubmissionPromptExecutionError(
          "未提出者への催促メール送信に失敗しました。手動対応が必要です。"
        );
      }
    );

    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: "2024-01-15T10:00:00Z",
    });
  });

  it("runTx6Imp1AgentからNonSubmissionPromptExecutionErrorがスローされ、指定のエラーメッセージであること", async () => {
    const input = {
      leaderUserId: "leader001",
      userInformationSubmissions,
      executionTimestamp: new Date("2024-01-15T10:00:00Z"),
      targetDate: new Date("2024-01-15"),
    };

    await expect(runTx6Imp1Agent(input)).rejects.toThrow(
      NonSubmissionPromptExecutionError
    );
    await expect(runTx6Imp1Agent(input)).rejects.toThrow(
      "未提出者への催促メール送信に失敗しました。手動対応が必要です。"
    );
  });
});
