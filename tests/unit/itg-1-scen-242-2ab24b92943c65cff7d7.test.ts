jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterManagement from '../../src/logic/reporter-master-management';

describe('SCEN-242: 報告期限時刻の形式が不正な場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('submissionDeadlineTime が HH:mm 形式でない場合、業務ルール br-tx_5-005 の制約1に基づき形式エラーが発生し、後続処理が実行されない', async () => {
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T16:59:00Z';
    const submissionDeadlineTime = 'invalid-format';
    const teamId = 'team-001';

    // テスト仕様の期待結果：
    // submissionDeadlineTime='invalid-format'がHH:mm形式でないことが検知され、
    // 業務ルール br-tx_5-005 の制約1に基づき「報告期限時刻の形式が正しくありません（HH:mm形式で指定してください）」の
    // エラーが発生する。
    // 呼び出し先のjudgeSchedulerExecutionTimingにおいて時間部分が00～23、分部分が00～59の範囲内であるかの
    // 形式チェックが実行され、形式検証に失敗することで後続処理（getActiveReportersForSubmissionCheck、
    // checkDailyReportExistsForDate等）が実行されない。

    // judgeSchedulerExecutionTiming をモック：形式チェック時にエラーを発生させる
    const errorMessage = '報告期限時刻の形式が正しくありません（HH:mm形式で指定してください）';
    (deadlineJudgment.judgeSchedulerExecutionTiming as jest.MockedFunction<any>).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    // getActiveReportersForSubmissionCheck をモック：呼ばれないことを確認するため
    const mockGetActiveReporters = reporterManagement.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
    mockGetActiveReporters.mockResolvedValueOnce([]);

    // 期待：形式チェックエラーで早期終了
    // 注：現在の実装では detectNonSubmittedReportersAtDeadline が judgeSchedulerExecutionTiming を呼ばないため、
    // このテストは失敗する。実装完成後に通るテスト。
    // 未解決事項を参照：.aivic/batches/68/unresolved.md

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate,
        currentDateTime,
        submissionDeadlineTime,
        teamId,
      })
    ).rejects.toThrow(errorMessage);

    // 期待：judgeSchedulerExecutionTiming（形式チェック処理）が呼ばれた
    expect((deadlineJudgment.judgeSchedulerExecutionTiming as jest.MockedFunction<any>)).toHaveBeenCalled();

    // 期待：形式検証に失敗したため、getActiveReportersForSubmissionCheck は呼ばれない
    expect(mockGetActiveReporters).not.toHaveBeenCalled();
  });
});
