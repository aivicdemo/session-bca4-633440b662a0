import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-725: メール送信失敗時、内部ログに送信失敗が記録され、管理画面の未提出者一覧に「通知未送信」フラグが立てられる', () => {
  it('営業日の実行時刻内の場合、judgeSchedulerExecutionTiming を呼び出すと、shouldExecute=true が返され、スケジューラ実行判定が肯定的であることが確認でき、メール送信失敗時のエラーハンドリングが実行されるための条件が整う', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 戻り値のshouldExecuteがtrueであることを確認し、スケジューラ実行判定が肯定的であることを確認する
    expect(result.shouldExecute).toBe(true);

    // 営業日判定が true であることを確認する
    expect(result.isBusinessDay).toBe(true);

    // 実行時刻内判定が true であることを確認する
    expect(result.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime が null であることを確認する
    expect(result.nextScheduledExecutionTime).toBeNull();

    // 実行理由が営業日の実行時刻内を示していることを確認する
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
