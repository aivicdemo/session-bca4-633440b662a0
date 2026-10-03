import { retrieveNonSubmissionDetectionDetails, UnauthorizedLeaderAccess } from '../../src/logic/daily-report-management-view';
import type { RetrieveNonSubmissionDetectionDetailsInput } from '../../src/logic/daily-report-management-view';

describe('SCEN-587: 自身のチーム以外の検知ログにアクセスしようとすると、UnauthorizedLeaderAccessエラーが発生する', () => {
  it('should throw UnauthorizedLeaderAccess when leader tries to access detection log from different team', async () => {
    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId: 'log-team-b-001',
      leaderId: 'leader-a'
    };

    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow(UnauthorizedLeaderAccess);
    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow('このログへのアクセス権限がありません。');
  });
});
