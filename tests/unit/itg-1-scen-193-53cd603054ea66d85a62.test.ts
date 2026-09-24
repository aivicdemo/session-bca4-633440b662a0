jest.mock('../../src/logic/business-day-deadline-judgment', () => {
  const actual = jest.requireActual('../../src/logic/business-day-deadline-judgment');
  return {
    ...actual,
    isBusinessDay: jest.fn(),
  };
});

import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;

describe('SCEN-193: 実行不可なとき、次回実行予定時刻は次営業日の指定時刻で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日ではない土曜日に呼び出された場合、nextScheduledExecutionTimeは次営業日月曜日の指定時刻を返す', async () => {
    // Step 1: isBusinessDay処理をスタブ化し、現在日付が営業日ではない（例：土曜日）を返すよう設定
    mockedIsBusinessDay.mockResolvedValue(false);

    // Step 2: judgeSchedulerExecutionTiming処理を以下の入力で呼び出す
    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-13T17:30:00Z', // 土曜日、ISO 8601形式
      scheduledExecutionTime: '17:30', // HH:mm形式
      executionTimeToleranceMinutes: 5, // デフォルト値
      timeZone: 'Asia/Tokyo', // デフォルト値
    });

    // Step 3: 戻り値の各フィールドを検証する
    // Expected Result: 出力型JudgeSchedulerExecutionTimingOutputの以下の値を確認
    expect(result.shouldExecute).toBe(false); // 営業日ではないため実行不可
    expect(result.isBusinessDay).toBe(false); // 現在日付が営業日ではない
    expect(result.isWithinExecutionWindow).toBe(true); // 現在時刻17:30は実行予定時刻17:30の許容範囲5分内
    expect(result.nextScheduledExecutionTime).toBe('2024-01-15T17:30:00Z'); // ISO 8601形式、次営業日月曜日の指定時刻
    expect(result.executionReason).toBe('営業日ではない'); // 理由文言
  });
});
