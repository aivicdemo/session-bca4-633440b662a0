import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  InvalidDetectionLogId,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-588: 形式が不正な検知ログIDを指定すると、InvalidDetectionLogId エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空文字列を検知ログIDとして指定するとInvalidDetectionLogIdエラーが発生する', async () => {
    const detectionLogId = '';
    const leaderId = 'leader-001';

    // 期待動作：InvalidDetectionLogId エラーが発生すること
    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      // エラーが発生しない場合はテスト失敗
      throw new Error('InvalidDetectionLogIdエラーが発生すべきですが、発生しませんでした。');
    } catch (error) {
      // エラーが InvalidDetectionLogId であることを確認
      if (!(error instanceof InvalidDetectionLogId)) {
        throw error;
      }
      // エラー文言が『検知ログIDの形式が不正です。』であることを確認
      expect(error.message).toBe('検知ログIDの形式が不正です。');
    }
  });

  it('nullを検知ログIDとして指定するとInvalidDetectionLogIdエラーが発生する', async () => {
    const detectionLogId = null as any;
    const leaderId = 'leader-001';

    // 期待動作：InvalidDetectionLogId エラーが発生すること
    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      // エラーが発生しない場合はテスト失敗
      throw new Error('InvalidDetectionLogIdエラーが発生すべきですが、発生しませんでした。');
    } catch (error) {
      // エラーが InvalidDetectionLogId であることを確認
      if (!(error instanceof InvalidDetectionLogId)) {
        throw error;
      }
      // エラー文言が『検知ログIDの形式が不正です。』であることを確認
      expect(error.message).toBe('検知ログIDの形式が不正です。');
    }
  });
});
