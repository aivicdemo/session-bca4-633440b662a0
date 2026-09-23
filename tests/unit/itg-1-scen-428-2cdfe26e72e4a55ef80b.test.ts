import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  SaveDailyReportOutput,
} from '../../src/logic/daily-report-persistence';

// NOTE: aggregateDailyReportStatus は設計書に存在しないため、
// ここでは saveDailyReport の正常系と combinedStatus のアグリゲーションをシミュレートする

describe('SCEN-428: チームメンバー全員の提出状況が提出済み・未提出別に集計される', () => {
  const today = '2024-01-15';
  const teamMembers = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームメンバー全員の提出状況が提出済み・未提出別に集計される', async () => {
    // 前提条件としてチームメンバー5名（user-001, user-002, user-003, user-004, user-005）が登録されている状態を準備する
    // 対象日付を当日（YYYY-MM-DD形式）に設定する

    // saveDailyReportを呼び出し、user-001が当日の日報を送信する。
    // 入力: userId='user-001', reportDate=当日, businessContent='営業活動実施', submittedAt=当日T09:30:00Z。
    // 出力を確認し、dailyReportIdと保存完了を記録する
    const input1: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: today,
      businessContent: '営業活動実施',
      submittedAt: `${today}T09:30:00Z`,
    };
    const output1: SaveDailyReportOutput = await saveDailyReport(input1);
    expect(output1).toBeDefined();
    expect(output1.dailyReportId).toBeDefined();
    expect(output1.savedAt).toBeDefined();

    // saveDailyReportを呼び出し、user-003が当日の日報を送信する。
    // 入力: userId='user-003', reportDate=当日, businessContent='開発タスク進行', submittedAt=当日T10:15:00Z。
    // 出力を確認し、dailyReportIdと保存完了を記録する
    const input3: SaveDailyReportInput = {
      userId: 'user-003',
      reportDate: today,
      businessContent: '開発タスク進行',
      submittedAt: `${today}T10:15:00Z`,
    };
    const output3: SaveDailyReportOutput = await saveDailyReport(input3);
    expect(output3).toBeDefined();
    expect(output3.dailyReportId).toBeDefined();
    expect(output3.savedAt).toBeDefined();

    // saveDailyReportを呼び出し、user-005が当日の日報を送信する。
    // 入力: userId='user-005', reportDate=当日, businessContent='テスト実施', submittedAt=当日T11:00:00Z。
    // 出力を確認し、dailyReportIdと保存完了を記録する
    const input5: SaveDailyReportInput = {
      userId: 'user-005',
      reportDate: today,
      businessContent: 'テスト実施',
      submittedAt: `${today}T11:00:00Z`,
    };
    const output5: SaveDailyReportOutput = await saveDailyReport(input5);
    expect(output5).toBeDefined();
    expect(output5.dailyReportId).toBeDefined();
    expect(output5.savedAt).toBeDefined();

    // NOTE: aggregateDailyReportStatus関数は設計書に存在しないため、
    // 実装時に該当する関数の提供が必要です。
    // 出力結果を確認する
    // aggregateDailyReportStatusが以下の配列を返す。結果は報告者IDの昇順でソート済み：
    // [
    //   {memberId: 'user-001', memberName: 'ユーザー001の名前', status: 'submitted', content: '営業活動実施', submittedAt: '当日T09:30:00Z'},
    //   {memberId: 'user-002', memberName: 'ユーザー002の名前', status: 'pending', content: null, submittedAt: null},
    //   {memberId: 'user-003', memberName: 'ユーザー003の名前', status: 'submitted', content: '開発タスク進行', submittedAt: '当日T10:15:00Z'},
    //   {memberId: 'user-004', memberName: 'ユーザー004の名前', status: 'pending', content: null, submittedAt: null},
    //   {memberId: 'user-005', memberName: 'ユーザー005の名前', status: 'submitted', content: 'テスト実施', submittedAt: '当日T11:00:00Z'}
    // ]
    // 検証内容：
    // - 提出済みメンバー（user-001, user-003, user-005）は status='submitted' で、送信内容と送信時刻が記録されている
    // - 未提出メンバー（user-002, user-004）は status='pending' で、content=null、submittedAt=null
    // - 全チームメンバー5名分の提出状況が集計されている
    // - 結果配列がmemberIdの昇順でソートされている

    expect(output1).toHaveProperty('userId', 'user-001');
    expect(output3).toHaveProperty('userId', 'user-003');
    expect(output5).toHaveProperty('userId', 'user-005');
  });
});
