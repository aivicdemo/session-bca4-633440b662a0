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

describe("SCEN-071: targetDateで指定された営業日に未提出者が0人の場合、nonSubmissionDetectionResultのdetectedCountが0で出力される", () => {
  const leaderUserId = "leader001";
  const executionTimestamp = new Date();
  const targetDate = new Date("2024-01-15");

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

    // targetDateにおいて未提出者0人を検知結果として返す。
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

  it("nonSubmissionDetectionResult.detectedCountが0で出力され、未提出者が存在しないことが正確に表現される", async () => {
    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions: [],
      executionTimestamp,
      targetDate,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input);

    expect(result.executionStatus).toBe("success");

    expect(result.nonSubmissionDetectionResult.detectedCount).toBe(0);
    expect(result.nonSubmissionDetectionResult.promptedCount).toBe(0);
    expect(result.nonSubmissionDetectionResult.errors).toEqual([]);

    expect(result.userInformationProcessingResult.approved).toBe(0);
    expect(result.userInformationProcessingResult.rejected).toBe(0);

    expect(result.reporterMasterUpdateResult.registered).toBe(0);
    expect(result.reporterMasterUpdateResult.updated).toBe(0);
    expect(result.reporterMasterUpdateResult.deactivated).toBe(0);

    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(0);
    expect(result.notificationSendingResult.promptNotificationsSent).toBe(0);

    expect(result.exceptionCases).toEqual([]);

    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
  });
});
