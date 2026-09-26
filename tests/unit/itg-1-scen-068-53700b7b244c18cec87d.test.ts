import { describe, it, expect } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-068: HR changes normal flow', () => {
  it('should record exception cases for HR changes', async () => {
    const mockAiClient = {} as Tx6Imp1AiClient;
    const output = await runTx6Imp1Agent(
      {
        leaderUserId: 'leader001',
        userInformationSubmissions: [
          { userId: 'user001', userName: 'name', email: 'email@example.com', department: 'dept', role: 'role' },
        ],
        executionTimestamp: new Date(),
        targetDate: new Date(),
      },
      mockAiClient
    );
    expect(output.exceptionCases).toBeDefined();
  });
});
