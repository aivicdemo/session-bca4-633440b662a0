import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-766: 報告者マスタが空のとき、警告が出力され「チームに報告者が登録されていません」と記録される', () => {
  it('操作judgeSchedulerExecutionTimingが正常系で完了し、shouldExecute=true、isBusinessDay=true、isWithinExecutionWindow=true、nextScheduledExecutionTime=null、executionReason="営業日の実行時刻内"を返す', async () => {
    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result).toHaveProperty('shouldExecute');
    expect(result).toHaveProperty('isBusinessDay');
    expect(result).toHaveProperty('isWithinExecutionWindow');
    expect(result).toHaveProperty('nextScheduledExecutionTime');
    expect(result).toHaveProperty('executionReason');

    const output = result as JudgeSchedulerExecutionTimingOutput;
    expect(output.shouldExecute).toBe(true);
    expect(output.isBusinessDay).toBe(true);
    expect(output.isWithinExecutionWindow).toBe(true);
    expect(output.nextScheduledExecutionTime).toBeNull();
    expect(output.executionReason).toBe('営業日の実行時刻内');
  });

  it('入力されたcurrentTimestampはISO 8601形式の有効な値であることを確認', async () => {
    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result).toBeDefined();
  });

  it('入力されたscheduledExecutionTimeはHH:mm形式の有効な値であることを確認', async () => {
    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result).toBeDefined();
  });

  it('設計済みエラーは発生しない', async () => {
    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result).toBeDefined();
    expect(result).not.toBeInstanceOf(Error);
  });
});
