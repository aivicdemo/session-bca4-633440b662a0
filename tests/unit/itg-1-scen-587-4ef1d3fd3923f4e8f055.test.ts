import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  UnauthorizedLeaderAccess,
} from '../../src/logic/daily-report-management-view';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';

describe('SCEN-587: 自身のチーム以外の検知ログにアクセスしようとすると、UnauthorizedLeaderAccessエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームに属していない検知ログにアクセスするとUnauthorizedLeaderAccessエラーが発生する', async () => {
    const detectionLogIdTeamB = 'log-team-b-001';
    const leaderIdTeamA = 'leader-a';

    jest.spyOn(reportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([
      {
        detectionLogId: detectionLogIdTeamB,
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:30:00Z',
        nonSubmittedReporters: [
          {
            userId: 'USER-999',
            userName: 'テストユーザー',
            emailAddress: 'test@example.com',
          },
        ],
      },
    ]);

    await expect(
      retrieveNonSubmissionDetectionDetails({
        detectionLogId: detectionLogIdTeamB,
        leaderId: leaderIdTeamA,
      })
    ).rejects.toThrow(UnauthorizedLeaderAccess);

    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId: detectionLogIdTeamB,
        leaderId: leaderIdTeamA,
      });
    } catch (error) {
      if (error instanceof UnauthorizedLeaderAccess) {
        expect(error.message).toContain('このログへのアクセス権限がありません');
      }
    }
  });
});
