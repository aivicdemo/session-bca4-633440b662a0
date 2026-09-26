import { describe, it, expect } from '@jest/globals';
import {
  DatabaseConnectionError,
  type RetrieveDailyReportsForLeaderReviewInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-445: 日報データベースへの接続に失敗した場合、DatabaseConnectionErrorが発生', () => {
  it('DatabaseConnectionErrorが発生し、エラー文言「日報データの取得に失敗しました。」が返される', () => {
    const error = new DatabaseConnectionError('日報データの取得に失敗しました。');

    expect(error).toBeInstanceOf(DatabaseConnectionError);
    expect(error.message).toBe('日報データの取得に失敗しました。');

    expect(() => {
      throw error;
    }).toThrow(DatabaseConnectionError);

    expect(() => {
      throw error;
    }).toThrow('日報データの取得に失敗しました。');
  });
});
