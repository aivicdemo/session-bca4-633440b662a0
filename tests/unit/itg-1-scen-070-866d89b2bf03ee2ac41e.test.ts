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

describe("SCEN-070: 提出されたユーザー情報が0件の場合、エージェントが正常に完了し各工程の件数が0で出力される", () => {
  const leaderUserId = "LEADER001";
  const executionTimestamp = new Date();
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

    mockedSubmitUserInformationForConfirmation.mockResolvedValue({});
    mockedConfirmAndApproveUserInformation.mockResolvedValue({});
    mockedRegisterReporter.mockResolvedValue({});
    mockedUpdateReporter.mockResolvedValue({});
    mockedDeactivateReporter.mockResolvedValue({});
    mockedRegisterReporterToMaster.mockResolvedValue({});
    mockedUpdateReporterInMaster.mockResolvedValue({});
    mockedDeactivateReporterInMaster.mockResolvedValue({});
    mockedSendUserInformationApprovalNotification.mockResolvedValue({});

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

  it("エージェント実行が全工程を完了し、全工程の件数が0のTx6Imp1AgentOutputを返す", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: [],
      executionTimestamp,
      targetDate,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input);

    expect(result.executionStatus).toBe("success");

    expect(result.userInformationProcessingResult).toEqual({
      approved: 0,
      rejected: 0,
      errors: [],
    });

    expect(result.reporterMasterUpdateResult).toEqual({
      registered: 0,
      updated: 0,
      deactivated: 0,
      errors: [],
    });

    expect(result.nonSubmissionDetectionResult).toEqual({
      detectedCount: 0,
      promptedCount: 0,
      errors: [],
    });

    expect(result.notificationSendingResult).toEqual({
      approvalNotificationsSent: 0,
      promptNotificationsSent: 0,
      failedNotifications: [],
    });

    expect(result.exceptionCases).toEqual([]);

    expect(typeof result.executionLog).toBe("string");
    expect(result.executionLog.length).toBeGreaterThan(0);

    expect(mockedAuthenticateAndAuthorizeLeaderAccess).toHaveBeenCalled();
    expect(mockedValidateUserInformationRequired).toHaveBeenCalled();
    expect(mockedDetectDuplicateEmailAddress).toHaveBeenCalled();
    expect(mockedSubmitUserInformationForConfirmation).not.toHaveBeenCalled();
    expect(mockedConfirmAndApproveUserInformation).not.toHaveBeenCalled();
    expect(mockedRegisterReporter).not.toHaveBeenCalled();
    expect(mockedUpdateReporter).not.toHaveBeenCalled();
    expect(mockedDeactivateReporter).not.toHaveBeenCalled();
    expect(mockedSendUserInformationApprovalNotification).not.toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockedRetrieveNonSubmissionDetectionLogsByDate).toHaveBeenCalled();
  });
});
