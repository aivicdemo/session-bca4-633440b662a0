import { judgeSchedulerExecutionTiming, InvalidCurrentTimestampError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

// テスト対象: SCEN-733
// システムの現在日時が取得できないとき、エラーが発生して処理が中断される

describe('SCEN-733: currentTimestamp が無効なときエラーが発生', () => {
  it('currentTimestamp が ISO 8601 形式でない場合、InvalidCurrentTimestampError をスロー', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: 'invalid-timestamp',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeSchedulerExecutionTiming(input)).toThrow(InvalidCurrentTimestampError);
  });

  it('currentTimestamp が空文字列の場合、エラーをスロー', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeSchedulerExecutionTiming(input)).toThrow();
  });
});
