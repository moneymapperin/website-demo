declare module '../../scripts/verify-contract.mjs' {
  export interface VerifyResult {
    passed: boolean;
    errors: string[];
    dartFilesCount: number;
    tablesScannedCount: number;
    columnsScannedCount: number;
    rpcsScannedCount: number;
    scannedTables: string[];
  }

  export function scanReferenceCode(referenceDir: string): {
    dartFilesCount: number;
    totalFromCalls: number;
    scannedTables: Map<string, Set<string>>;
    scannedRpcs: Map<string, Set<string>>;
    scannedColumns: Set<string>;
  };

  export function parseContractFile(contractPath: string): {
    schemaTables: Record<string, string[]>;
    rpcNames: string[];
  };

  export function verifyContract(options: {
    referenceDir: string;
    contractPath: string;
    verbose?: boolean;
  }): VerifyResult;
}
