import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  DetectionLogNotFound,
} from '../../src/logic/daily-report-management-view';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/daily-report-persistence');

describe('SCEN-586: 存在しない検知ログIDを指定すると、DetectionLogNotFound エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない検知ログIDを指定するとDetectionLogNotFoundエラーが発生する', async () => {
    const detectionLogId = 'nonexistent-log-id-999';
    const leaderId = 'leader-001';

    // スタブ準備：検知ログが存在しないため空配列を返す
    jest.mocked(retrieveNonSubmissionDetectionLogsByDate).mockResolvedValue([]);

    // 期待動作：DetectionLogNotFound エラーが発生すること
    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      // エラーが発生しない場合はテスト失敗
      throw new Error('DetectionLogNotFoundエラーが発生すべきですが、発生しませんでした。');
    } catch (error) {
      // エラーが DetectionLogNotFound であることを確認
      if (!(error instanceof DetectionLogNotFound)) {
        throw error;
      }
      // エラー文言が『検知ログが見つかりません。』であることを確認
      expect(error.message).toBe('検知ログが見つかりません。');
    }
  });
});
