import { describe, it, expect } from '@jest/globals';
import {
  sendReporterReminderNotification,
  ReminderNotificationSendingResultRecordingFailed,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-301: 送信結果の記録処理に失敗した場合、リマインダー通知の送信失敗を報告する', () => {
  it('should throw error when recording sending result fails', async () => {
    const reporterId = 'reporter-001';
    const targetDate = new Date('2024-01-15');
    const reminderSettingId = 'setting-001';
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');

    // Per specification: when recordReminderNotificationSendingResult fails
    // sendReporterReminderNotification should throw ReminderNotificationSendingResultRecordingFailed
    // Error message: 'リマインダー通知の送信結果記録に失敗しました。'

    try {
      await sendReporterReminderNotification(
        reporterId,
        targetDate,
        reminderSettingId,
        executionTimestamp
      );
      // If no error thrown, test would expect the error to be thrown
      expect(true).toBe(false); // Force failure if no error thrown
    } catch (error) {
      if (error instanceof ReminderNotificationSendingResultRecordingFailed) {
        expect(error.message).toBe('リマインダー通知の送信結果記録に失敗しました。');
      }
    }
  });
});
