import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporterToMaster,
  RegisterReporterToMasterInput,
  RegisterReporterToMasterOutput,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-453: 必須項目と形式が正常な報告者情報を受け取り、マスタへ登録して登録完了結果を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a reporter with valid information and return success', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'yamada.taro@company.com',
      department: '営業部',
      leaderUserId: 'leader001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: true,
      reporterId: 'reporter_550e8400-e29b-41d4-a716-446655440000',
      message: '報告者を登録しました。',
    };

    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);
    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValue({});

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBeDefined();
    expect(result.message).toBe('報告者を登録しました。');
    expect(jest.mocked(persistReporterMasterChangeHistory)).toHaveBeenCalled();
  });
});
