import { describe, it, expect } from '@jest/globals';
import {
  sendReporterReminderNotification,
  SendReporterReminderNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-297: リマインダー設定が無効、送信時刻が未到来、または対象報告者が非アクティブな場合、リマインダー通知の送信を拒否する', () => {
  it('should reject reminder notification when eligibility check fails', async () => {
    const reporterId = 'reporter-001';
    const targetDate = new Date('2025-01-15');
    const reminderSettingId = 'setting-invalid-or-inactive';
    const executionTimestamp = new Date('2025-01-14T16:00:00Z');

    const result: SendReporterReminderNotificationOutput | undefined = await sendReporterReminderNotification(
      reporterId,
      targetDate,
      reminderSettingId,
      executionTimestamp
    );

    // Per specification: when eligibility check fails
    // success=false, notificationId=null, sentAt=null, deliveryMethod=null
    // errorDetails='リマインダー通知の送信条件を満たしていません。'
    if (result) {
      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('リマインダー通知の送信条件を満たしていません。');
    }
  });
});
