import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporterToMaster,
  RegisterReporterToMasterInput,
  RegisterReporterToMasterOutput,
  ReporterRegistrationFailedError,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-456: データベース障害により登録処理が失敗した場合、登録失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail with database error when persistence operation throws', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '新規報告者',
      emailAddress: 'new.reporter@example.com',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者の登録に失敗しました。システム管理者に連絡してください。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者の登録に失敗しました。システム管理者に連絡してください。');
  });
});
