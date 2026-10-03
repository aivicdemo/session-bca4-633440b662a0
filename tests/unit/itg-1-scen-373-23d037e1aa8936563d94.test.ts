import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  ReporterNotFoundError,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/reporter-master-persistence');

describe('SCEN-373: 指定された報告者IDが存在しないと、ReporterNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された報告者IDが存在しないと、ReporterNotFoundErrorが発生する', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'reporter-999',
      reporterName: '新しい名前',
      emailAddress: 'newemail@example.com',
      department: '営業部',
      status: 'active',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const {
      retrieveReporterByUserId,
      updateReporterInMaster,
      persistReporterMasterChangeHistory,
    } = require('../../src/logic/reporter-master-persistence');

    retrieveReporterByUserId.mockResolvedValue(null);

    await expect(updateReporter(input)).rejects.toThrow(ReporterNotFoundError);
    await expect(updateReporter(input)).rejects.toThrow('指定された報告者が見つかりません。');

    expect(updateReporterInMaster).not.toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
