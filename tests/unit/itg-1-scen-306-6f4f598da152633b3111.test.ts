import { describe, it, expect } from '@jest/globals';
import {
  sendLeaderSubmissionNotification,
  SendLeaderSubmissionNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-306: 報告者が日報を提出し、リーダーへの通知が正常に送信される', () => {
  it('should send leader submission notification successfully', async () => {
    const reporterId = 'reporter-001';
    const leaderId = 'leader-001';
    const targetDate = new Date('2024-01-15');
    const submissionTimestamp = new Date('2024-01-15T09:30:00Z');
    const executionTimestamp = new Date('2024-01-15T09:31:00Z');

    const result: SendLeaderSubmissionNotificationOutput | undefined = await sendLeaderSubmissionNotification(
      reporterId,
      leaderId,
      targetDate,
      submissionTimestamp,
      executionTimestamp
    );

    // Per specification: normal case when all processes succeed
    // success=true, notificationId='notif-12345', sentAt=2024-01-15T09:31:05Z
    // deliveryMethod='email', errorDetails=null
    if (result) {
      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notif-12345');
      expect(result.sentAt).toEqual(new Date('2024-01-15T09:31:05Z'));
      expect(result.deliveryMethod).toBe('email');
      expect(result.errorDetails).toBeNull();
    }
  });
});
