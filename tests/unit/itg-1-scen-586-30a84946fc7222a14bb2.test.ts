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

  it('存在しない検知ログIDを指定するとDetectionLogNotFoundエラーが発生する', async () => {
    const detectionLogId = 'nonexistent-log-id-999';
    const leaderId = 'leader-001';

    jest.spyOn(reportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([]);

    await expect(
      retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      })
    ).rejects.toThrow(DetectionLogNotFound);

    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
    } catch (error) {
      if (error instanceof DetectionLogNotFound) {
        expect(error.message).toContain('検知ログが見つかりません');
      }
    }
  });
});
