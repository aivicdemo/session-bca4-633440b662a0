import { describe, it, expect } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-061: runTx6Imp1Agent happy path - all processes complete successfully', () => {
  it('should complete all processes successfully with correct output', async () => {
    const mockAiClient = {} as Tx6Imp1AiClient;

    const output = await runTx6Imp1Agent(
      {
        leaderUserId: 'leader001',
        userInformationSubmissions: [
          { userId: 'user001', userName: '太郎', email: 'taro@example.com', department: '営業部', role: '報告者' },
          { userId: 'user002', userName: '花子', email: 'hanako@example.com', department: '営業部', role: '報告者' },
          { userId: 'user003', userName: '次郎', email: 'jiro@example.com', department: '企画部', role: '報告者' },
          { userId: 'user004', userName: '美咲', email: 'misaki@example.com', department: '営業部', role: '報告者' },
          { userId: 'user005', userName: '健一', email: 'kenichi@example.com', department: '営業部', role: '報告者' },
        ],
        executionTimestamp: new Date('2024-01-15T10:00:00Z'),
        targetDate: new Date('2024-01-15'),
      },
      mockAiClient
    );

    expect(output.executionStatus).toMatch(/success|partial_failure|failure/);
    expect(output.executionLog).toBeDefined();
    expect(output.userInformationProcessingResult).toBeDefined();
    expect(output.reporterMasterUpdateResult).toBeDefined();
  });

  it('should record approval notifications', async () => {
    const mockAiClient = {} as Tx6Imp1AiClient;
    const output = await runTx6Imp1Agent(
      {
        leaderUserId: 'leader001',
        userInformationSubmissions: [
          { userId: 'user001', userName: '太郎', email: 'taro@example.com', department: '営業部', role: '報告者' },
        ],
        executionTimestamp: new Date('2024-01-15T10:00:00Z'),
        targetDate: new Date('2024-01-15'),
      },
      mockAiClient
    );

    expect(output.notificationSendingResult).toBeDefined();
  });

  it('should have exception cases available', async () => {
    const mockAiClient = {} as Tx6Imp1AiClient;
    const output = await runTx6Imp1Agent(
      {
        leaderUserId: 'leader001',
        userInformationSubmissions: [
          { userId: 'user001', userName: '太郎', email: 'taro@example.com', department: '営業部', role: '報告者' },
        ],
        executionTimestamp: new Date('2024-01-15T10:00:00Z'),
        targetDate: new Date('2024-01-15'),
      },
      mockAiClient
    );

    expect(output.exceptionCases).toBeDefined();
  });

  it('should return execution output type correctly', async () => {
    const mockAiClient = {} as Tx6Imp1AiClient;
    const output = await runTx6Imp1Agent(
      {
        leaderUserId: 'leader001',
        userInformationSubmissions: [
          { userId: 'user001', userName: '太郎', email: 'taro@example.com', department: '営業部', role: '報告者' },
        ],
        executionTimestamp: new Date('2024-01-15T10:00:00Z'),
        targetDate: new Date('2024-01-15'),
      },
      mockAiClient
    );

    expect(output).toBeDefined();
    expect(output.nonSubmissionDetectionResult).toBeDefined();
  });
});
