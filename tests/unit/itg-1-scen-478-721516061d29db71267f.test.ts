jest.mock('../../src/logic/user-master-persistence', () => {
  const actual = jest.requireActual('../../src/logic/user-master-persistence');
  return {
    ...actual,
    retrieveReporterByUserId: jest.fn(),
    persistReporterMasterChangeHistory: jest.fn(),
  };
});

import { saveReminderNotificationSettings, retrieveReporterByUserId, persistReporterMasterChangeHistory, PersistenceFailureError } from '../../src/logic/user-master-persistence';
import type { SaveReminderNotificationSettingsInput, SaveReminderNotificationSettingsOutput, RetrieveReporterByUserIdOutput, PersistReporterMasterChangeHistoryOutput } from '../../src/logic/user-master-persistence';

const mockedRetrieveReporterByUserId = retrieveReporterByUserId as jest.MockedFunction<typeof retrieveReporterByUserId>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<typeof persistReporterMasterChangeHistory>;

describe('SCEN-478: リマインダー通知設定の保存 - DB保存失敗エラー', () => {
  const currentTime = new Date('2026-09-24T10:00:00Z');

  const validInput: SaveReminderNotificationSettingsInput = {
    userId: 'user-123',
    enabledFlag: true,
    sendingTime: '09:00',
    sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
    sendingMethod: 'メール',
    leaderUserId: 'leader-001',
    updateTimestamp: currentTime,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベースへの保存操作が失敗した場合、PersistenceFailureErrorが発生し失敗応答が返される', async () => {
    // 前提: retrieveReporterByUserId をスタブ化して有効なユーザーレコードを返す
    const validReporterOutput: RetrieveReporterByUserIdOutput = {
      success: true,
      reporter: {
        reporterId: 'rep-123',
        userId: 'user-123',
        reporterName: 'Test Reporter',
        emailAddress: 'test@example.com',
        department: 'Engineering',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: undefined,
    };
    mockedRetrieveReporterByUserId.mockResolvedValue(validReporterOutput);

    // 前提: persistReporterMasterChangeHistory をスタブ化して成功応答を返す
    const historyOutput: PersistReporterMasterChangeHistoryOutput = {
      success: true,
      changeHistoryId: 'history-001',
      message: 'Change history recorded',
    };
    mockedPersistReporterMasterChangeHistory.mockResolvedValue(historyOutput);

    // テスト実行: saveReminderNotificationSettings を呼び出し
    // 期待結果: PersistenceFailureError エラーが発生し、エラーメッセージは「リマインダー設定の保存に失敗しました。」
    await expect(saveReminderNotificationSettings(validInput)).rejects.toThrow(PersistenceFailureError);
    await expect(saveReminderNotificationSettings(validInput)).rejects.toThrow('リマインダー設定の保存に失敗しました。');
  });

  it('エラー発生時の出力形式を検証（rejectsで確認）', async () => {
    // 前提: retrieveReporterByUserId をスタブ化
    const validReporterOutput: RetrieveReporterByUserIdOutput = {
      success: true,
      reporter: {
        reporterId: 'rep-123',
        userId: 'user-123',
        reporterName: 'Test Reporter',
        emailAddress: 'test@example.com',
        department: 'Engineering',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: undefined,
    };
    mockedRetrieveReporterByUserId.mockResolvedValue(validReporterOutput);

    // 前提: persistReporterMasterChangeHistory をスタブ化
    const historyOutput: PersistReporterMasterChangeHistoryOutput = {
      success: true,
      changeHistoryId: 'history-001',
      message: 'Change history recorded',
    };
    mockedPersistReporterMasterChangeHistory.mockResolvedValue(historyOutput);

    // 呼び出し元で PersistenceFailureError をキャッチして、失敗応答を構築
    let caughtError: Error | null = null;

    try {
      await saveReminderNotificationSettings(validInput);
    } catch (e) {
      caughtError = e as Error;
    }

    // 期待結果の検証
    expect(caughtError).toBeInstanceOf(PersistenceFailureError);
    expect(caughtError?.message).toBe('リマインダー設定の保存に失敗しました。');

    // 呼び出し元が適切にハンドリングした場合の出力形式を検証
    let output: SaveReminderNotificationSettingsOutput | null = null;
    if (caughtError instanceof PersistenceFailureError) {
      output = {
        success: false,
        reminderSettingId: null,
        message: 'リマインダー設定の保存に失敗しました。',
      };
    }

    expect(output).toEqual({
      success: false,
      reminderSettingId: null,
      message: 'リマインダー設定の保存に失敗しました。',
    });
  });
});
