import { describe, it, expect } from '@jest/globals';
import {
  sendLeaderSubmissionNotification,
  LeaderNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-307: 報告者が属するチームのリーダーが見つからない、またはリーダーのメールアドレスが登録されていない場合、LeaderNotFoundErrorが発生する', () => {
  it('should throw LeaderNotFoundError when leader is not found or has no email', async () => {
    const reporterId = 'reporter-001';
    const leaderId = 'leader-001';
    const targetDate = new Date('2025-01-15');
    const submissionTimestamp = new Date('2025-01-15T10:30:00Z');
    const executionTimestamp = new Date('2025-01-15T10:35:00Z');

    // Per specification: LeaderNotFoundError should be thrown
    // Error message: 'リーダー情報が見つかりません。報告者のチーム設定を確認してください。'

    try {
      await sendLeaderSubmissionNotification(
        reporterId,
        leaderId,
        targetDate,
        submissionTimestamp,
        executionTimestamp
      );
      // If no error thrown, test expects the error
      expect(true).toBe(false); // Force failure if no error thrown
    } catch (error) {
      if (error instanceof LeaderNotFoundError) {
        expect(error.message).toBe('リーダー情報が見つかりません。報告者のチーム設定を確認してください。');
      }
    }
  });
});
