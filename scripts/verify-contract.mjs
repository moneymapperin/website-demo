#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export function scanReferenceCode(referenceDir) {
  if (!fs.existsSync(referenceDir)) {
    throw new Error(`Reference directory does not exist: ${referenceDir}`);
  }

  const dartFiles = [];
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.dart')) {
        dartFiles.push(fullPath);
      }
    }
  }

  walkDir(referenceDir);

  const scannedTables = new Map(); // "schema.table" -> Set of files
  const scannedRpcs = new Map(); // "rpcName" -> Set of files
  const scannedColumns = new Set();
  let totalFromCalls = 0;

  // Pattern for .from('tableName') with optional preceding .schema('schemaName')
  // We match expressions that call .from('...')
  for (const filePath of dartFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find all .from('table') occurrences
    // Note: avoid Path.from or List.from by ensuring it's from('...')
    const fromRegex = /(?:\.schema\s*\(\s*['"]([^'"]+)['"]\s*\)\s*)?\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    while ((match = fromRegex.exec(content)) !== null) {
      const schemaName = match[1] || 'public';
      const tableName = match[2];
      const key = `${schemaName}.${tableName}`;

      if (!scannedTables.has(key)) {
        scannedTables.set(key, new Set());
      }
      scannedTables.get(key).add(path.relative(ROOT_DIR, filePath));
      totalFromCalls++;
    }

    // Find all .rpc('rpcName') occurrences
    const rpcRegex = /\.rpc\s*\(\s*['"]([^'"]+)['"]/g;
    let rpcMatch;
    while ((rpcMatch = rpcRegex.exec(content)) !== null) {
      const rpcName = rpcMatch[1];
      if (!scannedRpcs.has(rpcName)) {
        scannedRpcs.set(rpcName, new Set());
      }
      scannedRpcs.get(rpcName).add(path.relative(ROOT_DIR, filePath));
    }

    // Extract columns referenced in select('...'), eq('...'), ilike('...'), upsert/insert keys
    const eqRegex = /\.(?:eq|ilike|order)\s*\(\s*['"]([a-zA-Z0-9_]+)['"]/g;
    let colMatch;
    while ((colMatch = eqRegex.exec(content)) !== null) {
      scannedColumns.add(colMatch[1]);
    }

    // Keys in insert/upsert map literals
    const insertKeyRegex = /['"]([a-zA-Z0-9_]+)['"]\s*:/g;
    while ((colMatch = insertKeyRegex.exec(content)) !== null) {
      scannedColumns.add(colMatch[1]);
    }
  }

  return {
    dartFilesCount: dartFiles.length,
    totalFromCalls,
    scannedTables,
    scannedRpcs,
    scannedColumns,
  };
}

export function parseContractFile(contractPath) {
  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file does not exist: ${contractPath}`);
  }

  const content = fs.readFileSync(contractPath, 'utf-8');

  // Parse SCHEMA_TABLES object
  const schemaTables = {};
  const schemaTablesMatch = content.match(/export\s+const\s+SCHEMA_TABLES[^{]+(\{[\s\S]*?\n\s*\})\s*as\s+const/);
  if (schemaTablesMatch) {
    const rawObj = schemaTablesMatch[1];
    const schemaBlockRegex = /([a-zA-Z0-9_]+)\s*:\s*\[([\s\S]*?)\]/g;
    let block;
    while ((block = schemaBlockRegex.exec(rawObj)) !== null) {
      const schemaName = block[1];
      const tableList = (block[2].match(/['"]([^'"]+)['"]/g) || []).map((t) => t.replace(/['"]/g, ''));
      schemaTables[schemaName] = tableList;
    }
  }

  // Parse RPC_CONTRACTS
  const rpcNames = [];
  const rpcRegex = /name\s*:\s*['"]([^'"]+)['"]/g;
  let rpcMatch;
  while ((rpcMatch = rpcRegex.exec(content)) !== null) {
    rpcNames.push(rpcMatch[1]);
  }

  return { schemaTables, rpcNames };
}

export function verifyContract({ referenceDir, contractPath, verbose = false }) {
  const scanResult = scanReferenceCode(referenceDir);
  const contract = parseContractFile(contractPath);

  const errors = [];

  // 1. Assert scanned data > 0 (sanity check against vacuous pass)
  if (scanResult.dartFilesCount === 0) {
    errors.push(`No Dart files found in reference directory: ${referenceDir}`);
  }
  if (scanResult.scannedTables.size === 0) {
    errors.push(`No Supabase tables discovered in reference code!`);
  }
  if (scanResult.scannedColumns.size === 0) {
    errors.push(`No columns discovered in reference code!`);
  }

  // Flatten contract tables: "schema.table"
  const contractTableKeys = new Set();
  for (const [schema, tables] of Object.entries(contract.schemaTables)) {
    for (const table of tables) {
      contractTableKeys.add(`${schema}.${table}`);
    }
  }

  // 2. Check every scanned table exists in contract
  for (const [tableKey, files] of scanResult.scannedTables.entries()) {
    if (!contractTableKeys.has(tableKey)) {
      errors.push(
        `DRIFT: Table '${tableKey}' used in reference (${Array.from(files).join(', ')}) is MISSING from schemaContract.ts!`
      );
    }
  }

  // 3. Check every contract table exists in scanned reference (no phantom tables)
  for (const tableKey of contractTableKeys) {
    if (!scanResult.scannedTables.has(tableKey)) {
      errors.push(
        `DRIFT: Table '${tableKey}' defined in schemaContract.ts is NOT referenced anywhere in the Flutter codebase!`
      );
    }
  }

  // 4. Check RPCs
  for (const [rpcName, files] of scanResult.scannedRpcs.entries()) {
    if (!contract.rpcNames.includes(rpcName)) {
      errors.push(
        `DRIFT: RPC '${rpcName}' used in reference (${Array.from(files).join(', ')}) is MISSING from schemaContract.ts!`
      );
    }
  }
  for (const rpcName of contract.rpcNames) {
    if (!scanResult.scannedRpcs.has(rpcName)) {
      errors.push(
        `DRIFT: RPC '${rpcName}' defined in schemaContract.ts is NOT called in Flutter reference!`
      );
    }
  }

  const passed = errors.length === 0;

  return {
    passed,
    errors,
    dartFilesCount: scanResult.dartFilesCount,
    tablesScannedCount: scanResult.scannedTables.size,
    columnsScannedCount: scanResult.scannedColumns.size,
    rpcsScannedCount: scanResult.scannedRpcs.size,
    scannedTables: Array.from(scanResult.scannedTables.keys()).sort(),
  };
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const customContractPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.resolve(ROOT_DIR, 'src/lib/schemaContract.ts');

  const refDir = path.resolve(ROOT_DIR, 'reference/moneymapper_app/lib');

  console.log(`\n🔍 Verifying Schema Contract against Flutter reference...`);
  console.log(`📁 Reference Path : ${refDir}`);
  console.log(`📜 Contract Path  : ${customContractPath}\n`);

  try {
    const result = verifyContract({
      referenceDir: refDir,
      contractPath: customContractPath,
      verbose: true,
    });

    console.log(`📊 Scanned Files   : ${result.dartFilesCount} Dart files`);
    console.log(`📊 Unique Tables   : ${result.tablesScannedCount} tables across public, bse_data, core`);
    console.log(`📊 Unique Columns  : ${result.columnsScannedCount} column references`);
    console.log(`📊 Remote RPCs     : ${result.rpcsScannedCount} RPCs`);
    console.log(`\n📋 Verified Tables:`);
    for (const tbl of result.scannedTables) {
      console.log(`   ✓ ${tbl}`);
    }

    if (!result.passed) {
      console.error(`\n❌ VERIFICATION FAILED: Contract Drift Detected!`);
      for (const err of result.errors) {
        console.error(`   • ${err}`);
      }
      process.exit(1);
    }

    console.log(`\n✅ CONTRACT VERIFIED: ZERO DRIFT! All tables, schemas, and RPCs match 100%.\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Execution Error: ${err.message}\n`);
    process.exit(1);
  }
}
