import { describe, it, expect } from '@jest/globals';
import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

const INCOMPLETE_RECORD = {
  movementType: 'new_hire' as const,
  userId: 'usr_incomplete_001',
};

describe('SCEN-074: 人事異動情報の必須項目が不足している場合、InvalidPersonnelMovementDataエラーが発生する', () => {
  it('必須項目が欠落したPersonnelMovementRecordを渡すと、InvalidPersonnelMovementDataエラーが発生する', async () => {
    const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
    const mockAiClient: Tx7Imp1AiClient = {};

    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [INCOMPLETE_RECORD as any],
        executionTimestamp,
      },
      mockAiClient
    );

    await expect(resultPromise).rejects.toThrow(
      '人事異動情報の形式が不正です。'
    );
  });
});
