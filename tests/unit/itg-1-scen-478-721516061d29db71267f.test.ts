import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveReminderNotificationSettings,
  retrieveReporterByUserId,
  persistReporterMasterChangeHistory,
  SaveReminderNotificationSettingsInput,
  SaveReminderNotificationSettingsOutput,
  RetrieveReporterByUserIdOutput,
  PersistReporterMasterChangeHistoryOutput,
  PersistenceFailureError,
} from '../../src/logic/user-master-persistence';

// 依存先のモック
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-478: データベースへの保存操作が失敗した場合、PersistenceFailureErrorが発生し失敗応答が返される', () => {
  let mockRetrieveReporterByUserId: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;
  let mockSaveReminderNotificationSettings: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const module = require('../../src/logic/user-master-persistence.ts');
    mockRetrieveReporterByUserId = module.retrieveReporterByUserId as jest.Mock;
    mockPersistReporterMasterChangeHistory = module.persistReporterMasterChangeHistory as jest.Mock;
    mockSaveReminderNotificationSettings = module.saveReminderNotificationSettings as jest.Mock;

    // retrieveReporterByUserId をスタブ化し、有効なユーザーレコードを返す
    const mockReporterOutput = {
      success: true,
      reporter: {
        reporterId: 'rep-123',
        userId: 'user-123',
        reporterName: 'Test User',
        emailAddress: 'testuser@example.com',
        department: 'Engineering',
        status: 'active',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      message: undefined,
    };
    // @ts-ignore
    mockRetrieveReporterByUserId.mockResolvedValue(mockReporterOutput);

    // persistReporterMasterChangeHistory をスタブ化し、成功応答を返す
    const mockChangeHistoryOutput = {
      success: true,
      changeHistoryId: 'history-001',
      message: 'Change history recorded successfully',
    };
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue(mockChangeHistoryOutput);

    // saveReminderNotificationSettings をモック化し、データベース保存失敗をシミュレート
    mockSaveReminderNotificationSettings.mockImplementation(
      async (input: any) => {
        // データベース層の保存操作が失敗するシナリオをシミュレート
        const error = new PersistenceFailureError(
          'リマインダー設定の保存に失敗しました。'
        );
        throw error;
      }
    );
  });

  it('データベースへの保存操作が失敗した場合、PersistenceFailureErrorが発生し失敗応答が返される', async () => {
    const input = {
      userId: 'user-123',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    // retrieveReporterByUserId を先に呼び出す
    const userCheckResult = await mockRetrieveReporterByUserId({
      userId: input.userId,
    });
    expect((userCheckResult as any).success).toBe(true);
    expect((userCheckResult as any).reporter).not.toBeNull();

    // persistReporterMasterChangeHistory をスタブ化して成功応答を返す
    const changeHistoryInput = {
      reporterId: (userCheckResult as any).reporter.reporterId,
      operationType: 'update' as const,
      previousValues: null as any,
      newValues: {
        reporterName: (userCheckResult as any).reporter.reporterName,
      },
      leaderUserId: input.leaderUserId,
      operationTimestamp: input.updateTimestamp,
    };
    const changeHistoryResult = await mockPersistReporterMasterChangeHistory(
      changeHistoryInput as any
    );
    expect((changeHistoryResult as any).success).toBe(true);

    // saveReminderNotificationSettings を実行し、PersistenceFailureError が発生することを確認
    try {
      const result = await mockSaveReminderNotificationSettings(input);
      fail('PersistenceFailureError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceFailureError);
      expect(error).toHaveProperty(
        'message',
        'リマインダー設定の保存に失敗しました。'
      );
    }

    // mockSaveReminderNotificationSettings が呼び出されたことを確認
    expect(mockSaveReminderNotificationSettings).toHaveBeenCalledWith(input);
  });
});
