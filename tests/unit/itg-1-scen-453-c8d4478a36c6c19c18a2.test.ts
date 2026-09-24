import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporterToMaster,
  RegisterReporterToMasterInput,
  RegisterReporterToMasterOutput,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

import {
  validateUserInformationRequired,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-453: 必須項目と形式が正常な報告者情報を受け取り、マスタへ登録して登録完了結果を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register reporter with valid information and return success', async () => {
    const now = new Date();
    const input: RegisterReporterToMasterInput = {
      reporterName: '山田太郎',
      emailAddress: 'yamada.taro@company.com',
      department: '営業部',
      leaderUserId: 'leader001',
      registrationTimestamp: now,
    };

    (validateUserInformationRequired as any).mockReturnValue(true) as any;
    (validateEmailAddress as any).mockReturnValue(true) as any;
    (detectDuplicateEmailAddress as any).mockReturnValue(false) as any;
    (persistReporterMasterChangeHistory as any).mockResolvedValue({ success: true }) as any;

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBeDefined();
    expect(result.reporterId).not.toBeNull();
    expect(result.reporterId).toMatch(/^reporter_/);
    expect(result.message).toBe('報告者を登録しました。');

    expect(persistReporterMasterChangeHistory).toHaveBeenCalled();
    const persistCall = (persistReporterMasterChangeHistory as any).mock.calls[0][0];
    expect(persistCall.leaderUserId).toBe('leader001');
    expect(persistCall.registrationTimestamp).toBe(now);
  });
});
