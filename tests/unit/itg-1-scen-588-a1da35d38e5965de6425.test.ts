import { describe, it, expect, beforeEach } from '@jest/globals';
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

    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      throw new Error('InvalidDetectionLogIdエラーが発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof InvalidDetectionLogId)) {
        throw error;
      }
      expect(error.message).toBe('検知ログIDの形式が不正です。');
    }
  });

  it('nullを検知ログIDとして指定するとInvalidDetectionLogIdエラーが発生する', async () => {
    const detectionLogId = null as any;
    const leaderId = 'leader-001';

    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      throw new Error('InvalidDetectionLogIdエラーが発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof InvalidDetectionLogId)) {
        throw error;
      }
      expect(error.message).toBe('検知ログIDの形式が不正です。');
    }
  });

  it('検知ログIDの仕様に違反する文字列を指定するとInvalidDetectionLogIdエラーが発生する', async () => {
    const detectionLogId = 'invalid-format-xyz';
    const leaderId = 'leader-001';

    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      throw new Error('InvalidDetectionLogIdエラーが発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof InvalidDetectionLogId)) {
        throw error;
      }
      expect(error.message).toBe('検知ログIDの形式が不正です。');
    }
  });
});
