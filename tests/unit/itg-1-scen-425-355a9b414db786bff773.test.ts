import { describe, test, expect, jest } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  DuplicateSubmissionError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-425: 同一ユーザーIDと報告日の日報が既に存在する場合にDuplicateSubmissionErrorが発生する', () => {
  test('should throw DuplicateSubmissionError when duplicate report exists', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(DuplicateSubmissionError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      'この日付の日報は既に提出されています。'
    );
  });
});
