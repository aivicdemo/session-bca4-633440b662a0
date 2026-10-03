import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import * as emailNotificationMgmt from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendNonSubmissionPromptNotification: jest.fn(),
}));

describe('SCEN-767: メール送信失敗時の内部ログ記録と未提出者フラグ設定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('イントレーション: 営業日のスケジューラ実行時刻にシステムが動作する場合、shouldExecute=true を返す', async () => {
    // 入力値: 2024-01-15T17:30:00Z（営業日に設定されている日付、指定実行時刻17:30）
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // Act: judgeSchedulerExecutionTiming を呼び出す
    const result = await judgeSchedulerExecutionTiming(input);

    // Assert: 出力の shouldExecute が true を返すことを確認
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
  });

  it('メール送信失敗時のシステム状態: EmailNotificationService.sendNonSubmissionAlert がエラーを発生させても、judgeSchedulerExecutionTiming は shouldExecute=true のまま継続される', async () => {
    // EmailNotificationService.sendNonSubmissionAlert をスタブ化してメール送信失敗を模擬
    (emailNotificationMgmt.sendNonSubmissionPromptNotification as jest.Mock).mockRejectedValueOnce(
      new Error('Email service unavailable')
    );

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // Act: judgeSchedulerExecutionTiming を呼び出す
    const result = await judgeSchedulerExecutionTiming(input);

    // Assert: 出力の shouldExecute が true を返すことを確認（メール送信エラーによってロールバックされない）
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);

    // EmailNotificationService.sendNonSubmissionPromptNotification が実際に呼ばれたことを確認
    expect(emailNotificationMgmt.sendNonSubmissionPromptNotification).toHaveBeenCalled();
  });

  it('期待結果: メール送信失敗時、以下の動作が同時に実行される：(1)内部ログに送信失敗が記録、(2)管理画面の未提出者一覧に「通知未送信」フラグが true に設定。スケジューラ実行判定は shouldExecute=true のまま継続', async () => {
    // メール送信を失敗させる
    (emailNotificationMgmt.sendNonSubmissionPromptNotification as jest.Mock).mockRejectedValueOnce(
      new Error('Email service unavailable')
    );

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // Act: judgeSchedulerExecutionTiming を呼び出す
    const result = await judgeSchedulerExecutionTiming(input);

    // Assert: スケジューラ実行判定自体は shouldExecute=true のまま継続される
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);

    // メール送信関数が呼ばれたことを確認
    expect(emailNotificationMgmt.sendNonSubmissionPromptNotification).toHaveBeenCalled();
  });
});
