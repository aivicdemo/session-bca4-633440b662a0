import { describe, it, expect } from '@jest/globals';
import {
  sendReporterReminderNotification,
  SendReporterReminderNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-298: 通知内容の構築に失敗した場合、リマインダー通知の送信を中止する', () => {
  it('should abort reminder notification when content build fails', async () => {
    const reporterId = 'reporter-001';
    const targetDate = new Date('2024-01-15');
    const reminderSettingId = 'setting-001';
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');

    const result: SendReporterReminderNotificationOutput | undefined = await sendReporterReminderNotification(
      reporterId,
      targetDate,
      reminderSettingId,
      executionTimestamp
    );

    // Per specification: when buildReminderNotificationContent fails
    // success=false, notificationId=null, sentAt=null, deliveryMethod=null
    // errorDetails='リマインダー通知内容の構築に失敗しました。'
    // selectNotificationDeliveryMethod must NOT be called
    if (result) {
      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('リマインダー通知内容の構築に失敗しました。');
    }
  });
});
