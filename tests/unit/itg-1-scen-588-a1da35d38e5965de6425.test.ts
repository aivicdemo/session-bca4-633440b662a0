import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  InvalidDetectionLogId,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-588: 形式が不正な検知ログIDを指定すると、InvalidDetectionLogId エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空文字列を検知ログIDとして指定するとInvalidDetectionLogIdエラーが発生し、エラー文言が「検知ログIDの形式が不正です。」である', async () => {
    const detectionLogId = '';
    const leaderId = 'leader-001';

    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      fail('Expected InvalidDetectionLogId to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDetectionLogId);
      expect((error as Error).message).toBe('検知ログIDの形式が不正です。');
    }
  });
});
