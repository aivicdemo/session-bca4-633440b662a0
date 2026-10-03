import { retrieveNonSubmissionDetectionDetails, InvalidDetectionLogId } from '../../src/logic/daily-report-management-view';
import type { RetrieveNonSubmissionDetectionDetailsInput } from '../../src/logic/daily-report-management-view';

describe('SCEN-588: 形式が不正な検知ログIDを指定すると、InvalidDetectionLogId エラーが発生する', () => {
  it('should throw InvalidDetectionLogId when empty string is provided for detectionLogId', async () => {
    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId: '',
      leaderId: 'leader-001'
    };

    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow(InvalidDetectionLogId);
    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow('検知ログIDの形式が不正です。');
  });

  it('should throw InvalidDetectionLogId when null is provided for detectionLogId', async () => {
    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId: null as any,
      leaderId: 'leader-001'
    };

    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow(InvalidDetectionLogId);
    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow('検知ログIDの形式が不正です。');
  });

  it('should throw InvalidDetectionLogId when invalid format string is provided for detectionLogId', async () => {
    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId: 'invalid!!!format',
      leaderId: 'leader-001'
    };

    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow(InvalidDetectionLogId);
    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow('検知ログIDの形式が不正です。');
  });
});
