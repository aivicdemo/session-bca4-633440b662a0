import { describe, it, expect, beforeEach } from '@jest/globals';
import { saveDailyReport, DuplicateSubmissionError } from '../../src/logic/daily-report-persistence';

describe('SCEN-425: 同一ユーザーIDと報告日の日報が既に存在する場合にDuplicateSubmissionErrorが発生する', () => {
  beforeEach(async () => {
    const existingInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動',
      submittedAt: '2024-01-15T09:00:00Z',
    };
    try {
      await saveDailyReport(existingInput);
    } catch {
      // ignore if already exists
    }
  });

  it('should throw DuplicateSubmissionError when trying to save duplicate report', async () => {
    const input = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(DuplicateSubmissionError);
    await expect(saveDailyReport(input)).rejects.toThrow('この日付の日報は既に提出されています。');
  });
});
