import { runTx7Imp1Agent } from "../../src/agents/tx-7-imp-1/orchestrator";
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
  updateReporterInMaster,
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
} from "../../src/logic/user-master-persistence";
import { sendUserInformationApprovalNotification } from "../../src/logic/email-notification-management";

jest.mock("../../src/logic/reporter-master-management");
jest.mock("../../src/logic/input-validation-formatting");
jest.mock("../../src/logic/user-master-persistence");
jest.mock("../../src/logic/email-notification-management");

const NEW_HIRE_A = {
  movementType: "new_hire",
  userId: "usr_new_001",
  userName: "新入社員A",
  fullName: "新入社員A",
  email: "new_a@company.com",
  department: "営業部",
  teamId: "team_sales_01",
  effectiveDate: new Date("2024-04-01T00:00:00+09:00"),
};

const TRANSFER_B = {
  movementType: "transfer",
  userId: "usr_move_001",
  userName: "異動者B",
  fullName: "異動者B",
  email: "move_b@company.com",
  previousDepartment: "企画部",
  department: "営業部",
  teamId: "team_sales_01",
  effectiveDate: new Date("2024-04-01T00:00:00+09:00"),
};

const RETIREE_C = {
  movementType: "retirement",
  userId: "usr_retire_001",
  userName: "退職者C",
  fullName: "退職者C",
  email: "retire_c@company.com",
  effectiveDate: new Date("2024-04-01T00:00:00+09:00"),
};

describe("SCEN-072: 人事異動情報から新規登録・更新・削除の必要性が判定され、報告者マスタが正常に変更され、変更履歴が記録され、チームリーダーに通知される", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (validateUserInformationRequired as jest.Mock).mockResolvedValue(true);
    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue(false);

    (registerReporter as jest.Mock).mockResolvedValue({
      userId: NEW_HIRE_A.userId,
      status: "success",
    });
    (updateReporter as jest.Mock).mockResolvedValue({
      userId: TRANSFER_B.userId,
      status: "success",
      changedFields: ["department"],
    });
    (deactivateReporter as jest.Mock).mockResolvedValue({
      userId: RETIREE_C.userId,
      status: "success",
      deactivationReason: "retirement",
    });

    (registerReporterToMaster as jest.Mock).mockResolvedValue({ success: true });
    (updateReporterInMaster as jest.Mock).mockResolvedValue({ success: true });
    (deactivateReporterInMaster as jest.Mock).mockResolvedValue({ success: true });
    (persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue({ success: true });

    (sendUserInformationApprovalNotification as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it("新規登録1件・更新1件・削除1件を判定し、変更履歴の記録とリーダー通知が完結する", async () => {
    const executionTimestamp = new Date("2024-04-01T09:00:00+09:00");

    const result = await runTx7Imp1Agent({
      personnelMovementData: [NEW_HIRE_A, TRANSFER_B, RETIREE_C],
      executionTimestamp,
    });

    expect(result.registeredReporters).toHaveLength(1);
    expect(result.registeredReporters[0].userId).toBe(NEW_HIRE_A.userId);

    expect(result.updatedReporters).toHaveLength(1);
    expect(result.updatedReporters[0].userId).toBe(TRANSFER_B.userId);

    expect(result.deactivatedReporters).toHaveLength(1);
    expect(result.deactivatedReporters[0].userId).toBe(RETIREE_C.userId);

    expect(result.changeHistoryRecorded).toBe(true);
    expect(result.leaderNotificationSent).toBe(true);

    expect(persistReporterMasterChangeHistory).toHaveBeenCalledTimes(3);
    expect(sendUserInformationApprovalNotification).toHaveBeenCalledTimes(1);

    expect(result.executionSummary).toBe(
      "登録件数: 1、更新件数: 1、削除件数: 1、エラー件数: 0"
    );
  });
});
