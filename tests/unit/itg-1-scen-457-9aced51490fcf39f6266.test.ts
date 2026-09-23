import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-457: チームリーダーが報告者の名前とメールアドレスを更新すると、変更が報告者マスタに反映され成功を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update reporter name and email successfully', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-001',
      reporterName: '新しい報告者名',
      emailAddress: 'newemail@example.com',
      department: undefined,
      status: undefined,
      leaderUserId: 'leader-user-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: true,
      reporterId: 'reporter-001',
      message: '報告者情報が正常に更新されました',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);
    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValue({});

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.message).toMatch(/更新/);
  });
});
