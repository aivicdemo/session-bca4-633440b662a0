import {
  generateNonSubmissionDetectionResult,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-271: 未提出者リストが空配列で検知ログの未提出数が0のとき、管理画面表示用データと催促通知用データが整形される', () => {
  it('未提出者がいない場合、正常に結果を返す', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        nonSubmittedCount: 0,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    } as any;

    const result = generateNonSubmissionDetectionResult(input);

    // 結果が返されることを確認
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // 結果が空配列のレポーターと整形されたログを含むことを確認
    expect((result as any).nonSubmittedReporters).toEqual([]);
    expect((result as any).detectionCount).toBe(0);
  });
});
