import {
  runTx7Imp1Agent,
  ReporterNotFoundForDeactivation,
} from "../../src/agents/tx-7-imp-1/orchestrator";
import { deactivateReporterInMaster } from "../../src/logic/user-master-persistence";

jest.mock("../../src/logic/user-master-persistence");

const RETIREE = {
  movementType: "retirement",
  userId: "usr_retire_999",
  userName: "退職者G",
  fullName: "退職者G",
  email: "retire_g@company.com",
  effectiveDate: new Date("2024-04-01T00:00:00+09:00"),
};

describe("SCEN-077: 削除対象の報告者がマスタに存在しない場合、ReporterNotFoundForDeactivationエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (deactivateReporterInMaster as jest.Mock).mockRejectedValue(
      new ReporterNotFoundForDeactivation("削除対象の報告者が見つかりません。")
    );
  });

  it("マスタに存在しない報告者の削除でReporterNotFoundForDeactivationエラーが発生する", async () => {
    const executionTimestamp = new Date("2024-04-01T09:00:00+09:00");

    const resultPromise = runTx7Imp1Agent({
      personnelMovementData: [RETIREE],
      executionTimestamp,
    });

    await expect(resultPromise).rejects.toThrow(
      ReporterNotFoundForDeactivation
    );
    await expect(resultPromise).rejects.toThrow(
      "削除対象の報告者が見つかりません。"
    );
  });
});
