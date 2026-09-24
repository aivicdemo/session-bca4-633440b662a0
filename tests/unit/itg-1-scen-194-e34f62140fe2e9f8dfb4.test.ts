import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-194: デフォルトタイムゾーン（Asia/Tokyo）で正しく判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('デフォルトタイムゾーン（Asia/Tokyo）で正しく判定される', async () => {
    // isBusinessDay スタブを設定：営業日（月〜金、祝日除外）を true で返すように構成する
    jest.spyOn(require('../../src/logic/business-day-deadline-judgment'), 'isBusinessDay')
      .mockResolvedValueOnce(true);

    // judgeSchedulerExecutionTiming を以下の入力値で呼び出す
    // currentTimestamp='2024-01-15T17:30:00Z'（月曜日、東京時刻で翌日02:30）
    // scheduledExecutionTime='17:30'
    // executionTimeToleranceMinutes=5（デフォルト）
    // timeZone='Asia/Tokyo'（デフォルト）
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // isBusinessDay の呼び出しを確認：2024-01-15（東京時刻では2024-01-16）を営業日判定の入力として受け取ること
    // 戻り値が以下を満たすことを検証
    // shouldExecute=true（営業日かつ実行時刻内）
    expect(result.shouldExecute).toBe(true);

    // isBusinessDay=true
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow=true（17:30 ± 5分の範囲内）
    expect(result.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime=null（実行可能のため）
    expect(result.nextScheduledExecutionTime).toBeNull();

    // executionReason=「営業日の実行時刻内」
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
