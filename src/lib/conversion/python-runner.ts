import { execFile } from "child_process";
import path from "path";
import fs from "fs";

const CONVERT_SCRIPT = path.join(
  process.cwd(),
  "src",
  "lib",
  "conversion",
  "scripts",
  "convert.py"
);

export interface PythonConversionOutput {
  success: boolean;
  sourceFormat: string;
  targetFormat: string;
  outputSize: number;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Execute convert.py with deterministic arguments
 */
export async function runPythonConversion(
  sourcePath: string,
  targetPath: string,
  fromFormat: string,
  toFormat: string,
  extraOptions?: Record<string, any>
): Promise<PythonConversionOutput> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(sourcePath)) {
      return reject(new Error(`Source file does not exist: ${sourcePath}`));
    }

    const args = [
      CONVERT_SCRIPT,
      "--source",
      sourcePath,
      "--target",
      targetPath,
      "--from-format",
      fromFormat,
      "--to-format",
      toFormat,
    ];

    if (extraOptions && Object.keys(extraOptions).length > 0) {
      args.push("--extra", JSON.stringify(extraOptions));
    }

    // Windows compatibility: use 'python'
    execFile(
      "python",
      args,
      { maxBuffer: 10 * 1024 * 1024, timeout: 60000 },
      (error, stdout, stderr) => {
        if (stdout && stdout.trim()) {
          try {
            // Find last JSON line in stdout (in case of warnings)
            const lines = stdout.trim().split("\n");
            for (let i = lines.length - 1; i >= 0; i--) {
              try {
                const parsed = JSON.parse(lines[i]);
                if (parsed.success === false && parsed.error) {
                  return reject(new Error(parsed.error));
                }
                return resolve(parsed);
              } catch {}
            }
          } catch {}
        }

        if (error) {
          const errMsg = stderr || error.message || "Conversion execution failed.";
          return reject(new Error(errMsg));
        }

        resolve({
          success: true,
          sourceFormat: fromFormat,
          targetFormat: toFormat,
          outputSize: fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0,
        });
      }
    );
  });
}
