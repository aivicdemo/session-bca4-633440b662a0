import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-756: 5名全員が前日に日報を提出しなかった場合、全員が未提出者として記録される', () => {
  it('営業日の定時スケジューラ実行時刻に到達した状態で、judgeSchedulerExecutionTimingを呼び出す', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const output: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // Step 2: 出力型JudgeSchedulerExecutionTimingOutputのshouldExecuteフィールドがtrueであることを確認する。
    expect(output.shouldExecute).toBe(true);

    // Step 3: 出力型のisBusinessDayフィールドがtrueであることを確認する。
    expect(output.isBusinessDay).toBe(true);

    // Step 4: 出力型のisWithinExecutionWindowフィールドがtrueであることを確認する。
    expect(output.isWithinExecutionWindow).toBe(true);

    // Step 5: 出力型のnextScheduledExecutionTimeフィールドがnullであることを確認する。
    expect(output.nextScheduledExecutionTime).toBeNull();

    // Step 6: 出力型のexecutionReasonフィールドが「営業日の実行時刻内」であることを確認する。
    expect(output.executionReason).toBe('営業日の実行時刻内');
  });
});
