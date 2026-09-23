import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { updateReporter } from '../../src/logic/reporter-master-management';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';
import { ReporterNotFoundError } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-373: ReporterNotFoundError when reporterId does not exist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReporterNotFoundError when reporter is not found', async () => {
    // 前提条件：retrieveReporterByUserId をスタブ化し、null を返す
    (userMasterPersistence.retrieveReporterByUserId as any).mockResolvedValue(null);

    // updateReporter を呼び出す
    const input = {
      reporterId: 'reporter-999',
      reporterName: '新しい名前',
      emailAddress: 'newemail@example.com',
      department: '営業部',
      status: 'active',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    // ReporterNotFoundError が発生することを期待
    await expect(updateReporter(input)).rejects.toThrow(ReporterNotFoundError);

    // エラーメッセージを確認
    try {
      await updateReporter(input);
    } catch (error) {
      if (error instanceof ReporterNotFoundError) {
        expect(error.message).toBe('指定された報告者が見つかりません。');
      }
    }
  });
});
