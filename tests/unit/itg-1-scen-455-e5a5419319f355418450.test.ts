import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporterToMaster,
  RegisterReporterToMasterInput,
  RegisterReporterToMasterOutput,
  DuplicateReporterEmailError,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-455: 入力されたメールアドレスが既にマスタに登録されている場合、登録失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when email address is already registered', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'yamada.taro@company.jp',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: 'このメールアドレスは既に登録されています。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。');
  });
});
