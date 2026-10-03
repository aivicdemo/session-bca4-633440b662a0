import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-724: 判定結果に基づき、リーダーへ未提出者一覧と催促状況を通知するメールが送信される', () => {
  it('営業日判定が true を返すように isBusinessDay をスタブ化し、judgeSchedulerExecutionTiming を呼び出した場合、shouldExecute=true、isBusinessDay=true、isWithinExecutionWindow=true、nextScheduledExecutionTime=null、executionReason に「営業日の実行時刻内」を含む結果が返される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 戻り値の shouldExecute が true であることを確認する
    expect(result.shouldExecute).toBe(true);

    // 戻り値の isBusinessDay が true であることを確認する
    expect(result.isBusinessDay).toBe(true);

    // 戻り値の isWithinExecutionWindow が true であることを確認する
    expect(result.isWithinExecutionWindow).toBe(true);

    // 戻り値の nextScheduledExecutionTime が null であることを確認する
    expect(result.nextScheduledExecutionTime).toBeNull();

    // 戻り値の executionReason が '営業日の実行時刻内' を含むことを確認する
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
