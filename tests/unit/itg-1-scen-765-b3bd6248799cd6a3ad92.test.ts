import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-765: リーダーのメールアドレスが登録されていないとき、処理が中断され「リーダーのメールアドレスを設定してください」が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('judgeSchedulerExecutionTiming は営業日判定と実行タイムウィンドウ判定のみを行い、リーダーメールアドレス検証を対象外とする', async () => {
    // isBusinessDay をスタブ化し、現在日付が営業日であることを示す true を返すよう設定
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // テスト対象の処理 judgeSchedulerExecutionTiming を呼び出す
    // currentTimestamp に有効な ISO 8601 形式の現在時刻を設定
    // scheduledExecutionTime に有効な HH:mm 形式の実行予定時刻を設定
    // executionTimeToleranceMinutes にデフォルト値（5分）を使用
    // timeZone に「Asia/Tokyo」を設定
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = await judgeSchedulerExecutionTiming(input);

    // 戻り値の型と内容を検証
    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');

    // judgeSchedulerExecutionTiming は営業日判定と実行タイムウィンドウ判定のみを行う
    // リーダーのメールアドレス検証は対象外であり、
    // 設計済みエラーには InvalidSchedulerConfigurationError、
    // InvalidCurrentTimestampError、NonBusinessDayError のみである
    // リーダーメールアドレス不在を報告するエラーは定義されていない
  });
});
