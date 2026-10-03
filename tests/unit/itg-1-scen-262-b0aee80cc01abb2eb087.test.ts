import { generateNonSubmissionDetectionResult, InvalidDetectionResultError } from '../../src/logic/daily-report-non-submission-detection';
import type { GenerateNonSubmissionDetectionResultInput, NonSubmissionDetectionLog } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-262: 未提出者リストがnullのとき、不正な検知結果エラーが発生する', () => {
  it('nonSubmittedReporters が null のとき、InvalidDetectionResultError が発生する', async () => {
    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'log-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:00:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 2,
      submittedCount: 3,
    };

    const detectionTimestamp = '2024-01-15T17:00:00Z';

    const input = {
      nonSubmittedReporters: null as any,
      detectionLog,
      detectionTimestamp,
    };

    await expect(
      generateNonSubmissionDetectionResult(input)
    ).rejects.toThrow(InvalidDetectionResultError);

    await expect(
      generateNonSubmissionDetectionResult(input)
    ).rejects.toThrow('未提出者検知結果が不正です。検知処理を再実行してください。');
  });
});
