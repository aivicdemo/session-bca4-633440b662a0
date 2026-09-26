import { describe, it, expect } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  UnauthorizedAccessError,
  type RetrieveDailyReportsForLeaderReviewInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-444: 呼び出し元ユーザーがリーダー権限を持たない場合、UnauthorizedAccessErrorが発生', () => {
  it('リーダー権限を持たないユーザーIDで呼び出した場合、UnauthorizedAccessError がスローされる', async () => {
    // リーダー権限を持たないユーザーのID
    const unauthorizedLeaderId = 'user_without_leader_permission';

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: unauthorizedLeaderId,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    // 実装が権限を検証してエラーをスロー
    await expect(retrieveDailyReportsForLeaderReview(input)).rejects.toThrow(
      UnauthorizedAccessError
    );
  });

  it('エラー発生時、エラー文言として「この操作を実行する権限がありません。」が返される', async () => {
    // リーダー権限を持たないユーザーのID
    const unauthorizedLeaderId = 'user_without_leader_permission';

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: unauthorizedLeaderId,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    // エラーメッセージが正確であることを確認
    try {
      await retrieveDailyReportsForLeaderReview(input);
      fail('UnauthorizedAccessError がスローされることが期待されています。');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedAccessError);
      expect((error as UnauthorizedAccessError).message).toBe(
        'この操作を実行する権限がありません。'
      );
    }
  });
});
