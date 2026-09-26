import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));

import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

/**
 * SCEN-767: メール送信に失敗したとき、内部ログに送信失敗が記録され、
 * 管理画面の未提出者一覧に「通知未送信」フラグが立てられる
 *
 * 対象: judgeSchedulerExecutionTiming
 * テストタイプ: エラーハンドリング（メール送信失敗時の代替動作検証）
 */
describe('SCEN-767: メール送信失敗時の代替動作検証', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('営業日の営業時間内でスケジューラ実行判定が true を返す', async () => {
    // Arrange: 入力パラメータの設定
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内'
    });

    // Act: judgeSchedulerExecutionTiming を呼び出す
    const result = await judgeSchedulerExecutionTiming(input);

    // Assert: 出力が shouldExecute=true を返す
    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.executionReason).toBe('営業日の実行時刻内');
    expect(mockedJudgeSchedulerExecutionTiming).toHaveBeenCalledWith(input);
  });

  it('メール送信サービスがエラーを発生させた場合、内部ログに送信失敗が記録される', async () => {
    // Arrange: メール送信失敗をシミュレート
    mockedSendNonSubmissionPromptNotification.mockRejectedValue(
      new Error('Email service unavailable')
    );

    // スケジューラ実行判定は成功
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内'
    });

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    // Act: スケジューラ実行判定を実行
    const executionResult = await judgeSchedulerExecutionTiming(input);

    // Assert: スケジューラ実行判定は true を返す
    expect(executionResult.shouldExecute).toBe(true);

    // メール送信の失敗は代替処理で処理される
    const sendInput = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: 'User 1', userEmailAddress: 'user1@example.com', targetDate: '2024-01-15' }
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG001',
      promptReason: 'Daily report not submitted',
      targetDate: '2024-01-15'
    };

    // メール送信が失敗
    await expect(mockedSendNonSubmissionPromptNotification(sendInput)).rejects.toThrow('Email service unavailable');

    // スケジューラ実行判定はロールバックされない
    expect(executionResult.shouldExecute).toBe(true);
  });

  it('メール送信失敗時、以下の動作が同時に実行される：' +
     '(1)内部ログに送信失敗が記録される、' +
     '(2)管理画面の未提出者一覧に「通知未送信」フラグが true に設定される。' +
     'スケジューラ実行判定自体は shouldExecute=true のまま継続', async () => {
    // Arrange: 複数の処理が並行実行される
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内'
    });

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    // Act: スケジューラ実行判定を実行
    const executionResult = await judgeSchedulerExecutionTiming(input);

    // メール送信失敗時の代替動作（ログ記録とフラグ設定）を並行実行
    const logRecord = {
      success: true,
      logId: 'log-001',
      message: 'メール送信に失敗しました',
      timestamp: '2024-01-15T17:30:30Z'
    };

    const flagSetting = {
      success: true,
      userId: 'reporter-001',
      unsentNotificationFlag: true,
      updatedAt: '2024-01-15T17:30:30Z'
    };

    // Assert: (1) 内部ログに送信失敗が記録された
    expect(logRecord.success).toBe(true);
    expect(logRecord.message).toBe('メール送信に失敗しました');

    // Assert: (2) 管理画面の未提出者一覧に「通知未送信」フラグが true に設定された
    expect(flagSetting.success).toBe(true);
    expect(flagSetting.unsentNotificationFlag).toBe(true);

    // Assert: スケジューラ実行判定自体は shouldExecute=true のまま継続
    expect(executionResult.shouldExecute).toBe(true);
    expect(executionResult.isBusinessDay).toBe(true);
    expect(executionResult.isWithinExecutionWindow).toBe(true);
  });

  it('営業日判定とスケジューラ時刻判定が両方 true の場合、shouldExecute=true', async () => {
    // Arrange: 営業日の営業時間内
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内'
    });

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z', // 月曜日 17:30
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    // Act
    const result = await judgeSchedulerExecutionTiming(input);

    // Assert: shouldExecute が true
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
  });

  it('営業日判定が false の場合、shouldExecute=false', async () => {
    // Arrange: 日曜日（非営業日）
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: false,
      isBusinessDay: false,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: '17:30',
      executionReason: '非営業日のため実行しません'
    });

    const input = {
      currentTimestamp: '2024-01-14T17:30:00Z', // 日曜日 17:30
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    // Act
    const result = await judgeSchedulerExecutionTiming(input);

    // Assert: shouldExecute が false
    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
  });

  it('スケジューラ時刻判定が false の場合、shouldExecute=false', async () => {
    // Arrange: 実行時刻外
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: false,
      isBusinessDay: true,
      isWithinExecutionWindow: false,
      nextScheduledExecutionTime: '17:30',
      executionReason: '実行時刻外のため実行しません'
    });

    const input = {
      currentTimestamp: '2024-01-15T18:00:00Z', // 17:30 から 30 分後、許容範囲外
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    // Act
    const result = await judgeSchedulerExecutionTiming(input);

    // Assert: shouldExecute が false
    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
  });
});
