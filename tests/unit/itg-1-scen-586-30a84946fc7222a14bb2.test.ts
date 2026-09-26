import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  DetectionLogNotFound,
} from '../../src/logic/daily-report-management-view';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';

describe('SCEN-586: 存在しない検知ログIDを指定すると、DetectionLogNotFoundエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない検知ログIDを指定するとDetectionLogNotFoundエラーが発生し、エラー文言が「検知ログが見つかりません。」である', async () => {
    const detectionLogId = 'nonexistent-log-id-999';
    const leaderId = 'leader-001';

    // モック: 存在しない検知ログIDに対して空結果を返す
    jest.spyOn(reportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate' as any).mockResolvedValue([] as any);

    // DetectionLogNotFoundエラーが発生することを確認
    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      fail('Expected DetectionLogNotFound to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DetectionLogNotFound);
      expect((error as Error).message).toBe('検知ログが見つかりません。');
    }
  });
});
