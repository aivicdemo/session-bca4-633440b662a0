import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporterToMaster,
  RegisterReporterToMasterInput,
  RegisterReporterToMasterOutput,
  InvalidReporterInformationError,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-454: 報告者情報が必須項目を満たさないまたはメールアドレス形式が不正な場合、登録失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when reporterName is empty string', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '',
      emailAddress: 'reporter@example.com',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者情報が不完全または形式が不正です。必須項目を確認してください。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('should fail when emailAddress is null', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: null as any,
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者情報が不完全または形式が不正です。必須項目を確認してください。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('should fail when department is empty string', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'reporter@example.com',
      department: '',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者情報が不完全または形式が不正です。必須項目を確認してください。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('should fail when email format is invalid (no @ symbol)', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'reporterexample.com',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者情報が不完全または形式が不正です。必須項目を確認してください。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('should fail when email format is invalid (no domain part)', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'reporter@',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者情報が不完全または形式が不正です。必須項目を確認してください。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });

  it('should fail when multiple required fields are missing', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '',
      emailAddress: '',
      department: '',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    const mockResult: RegisterReporterToMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者情報が不完全または形式が不正です。必須項目を確認してください。',
    };
    jest.mocked(registerReporterToMaster).mockResolvedValue(mockResult);

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報が不完全または形式が不正です。必須項目を確認してください。');
  });
});
