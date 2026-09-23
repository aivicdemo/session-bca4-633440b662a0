import {
  runTx7Imp1Agent,
  ReporterMasterUpdateFailed,
} from "../../src/agents/tx-7-imp-1/orchestrator";
import {
  registerReporter,
  updateReporter,
  deactivateReporter,
} from "../../src/logic/reporter-master-management";
import {
  validateUserInformationRequired,
  detectDuplicateEmailAddress,
} from "../../src/logic/input-validation-formatting";
import {
  registerReporterToMaster,
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
} from "../../src/logic/user-master-persistence";
import { sendUserInformationApprovalNotification } from "../../src/logic/email-notification-management";

jest.mock("../../src/logic/reporter-master-management");
jest.mock("../../src/logic/input-validation-formatting");
jest.mock("../../src/logic/user-master-persistence");
jest.mock("../../src/logic/email-notification-management");

const NEW_HIRE = {
  movementType: "new_hire",
  userId: "usr_new_101",
  userName: "新入社員D",
  fullName: "新入社員D",
  email: "new_d@company.com",
  department: "営業部",
  teamId: "team_sales_01",
  effectiveDate: new Date("2024-04-01T00:00:00+09:00"),
};

const TRANSFER = {
  movementType: "transfer",
  userId: "usr_move_101",
  userName: "異動者E",
  fullName: "異動者E",
  email: "move_e@company.com",
  previousDepartment: "企画部",
  department: "営業部",
  teamId: "team_sales_01",
  effectiveDate: new Date("2024-04-01T00:00:00+09:00"),
};

const RETIREE = {
  movementType: "retirement",
  userId: "usr_retire_101",
  userName: "退職者F",
  fullName: "退職者F",
  email: "retire_f@company.com",
  effectiveDate: new Date("2024-04-01T00:00:00+09:00"),
};

describe("SCEN-076: 報告者マスタの登録・更新・削除処理がシステム障害により失敗した場合、ReporterMasterUpdateFailedエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (validateUserInformationRequired as jest.Mock).mockResolvedValue(true);
    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue(false);

    (registerReporter as jest.Mock).mockResolvedValue({
      userId: NEW_HIRE.userId,
      status: "success",
    });
    (updateReporter as jest.Mock).mockRejectedValue(
      new Error("報告者マスタへの更新処理でシステム障害が発生しました。")
    );
    (deactivateReporter as jest.Mock).mockResolvedValue({
      userId: RETIREE.userId,
      status: "success",
      deactivationReason: "retirement",
    });

    (registerReporterToMaster as jest.Mock).mockResolvedValue({ success: true });
    (deactivateReporterInMaster as jest.Mock).mockResolvedValue({ success: true });
    (persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue({
      success: true,
    });

    (sendUserInformationApprovalNotification as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it("updateReporterのシステム障害によりReporterMasterUpdateFailedエラーが発生する", async () => {
    const executionTimestamp = new Date("2024-04-01T09:00:00+09:00");

    const resultPromise = runTx7Imp1Agent({
      personnelMovementData: [NEW_HIRE, TRANSFER, RETIREE],
      executionTimestamp,
    });

    await expect(resultPromise).rejects.toThrow(ReporterMasterUpdateFailed);
    await expect(resultPromise).rejects.toThrow(
      "報告者マスタの更新に失敗しました。"
    );
  });
});
