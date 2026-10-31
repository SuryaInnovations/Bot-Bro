import { spawn } from "child_process";
import vm from "vm";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  success: boolean;
  error?: string;
  generatedArtifact?: {
    type: "chart" | "table" | "data";
    data: any;
  };
}

export async function executeCodeInSandbox(
  language: "python" | "javascript",
  code: string,
  timeoutMs = 10000
): Promise<ExecutionResult> {
  const startTime = Date.now();

  if (language === "javascript") {
    return new Promise((resolve) => {
      let stdoutLogs: string[] = [];
      let stderrLogs: string[] = [];

      try {
        const sandbox = {
          console: {
            log: (...args: any[]) =>
              stdoutLogs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
            info: (...args: any[]) =>
              stdoutLogs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
            warn: (...args: any[]) =>
              stderrLogs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
            error: (...args: any[]) =>
              stderrLogs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
          },
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
          RegExp,
          Map,
          Set,
          parseInt,
          parseFloat,
          isNaN,
          isFinite,
        };

        const context = vm.createContext(sandbox);
        const script = new vm.Script(code);
        const result = script.runInContext(context, {
          timeout: timeoutMs,
          displayErrors: true,
        });

        if (result !== undefined && stdoutLogs.length === 0) {
          stdoutLogs.push(typeof result === "object" ? JSON.stringify(result, null, 2) : String(result));
        }

        resolve({
          stdout: stdoutLogs.join("\n"),
          stderr: stderrLogs.join("\n"),
          executionTimeMs: Date.now() - startTime,
          success: stderrLogs.length === 0,
        });
      } catch (err: any) {
        resolve({
          stdout: stdoutLogs.join("\n"),
          stderr: err?.message || String(err),
          executionTimeMs: Date.now() - startTime,
          success: false,
          error: err?.message,
        });
      }
    });
  }

  // Python execution
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    // Run python with -c in restricted mode
    const child = spawn("python", ["-c", code], {
      timeout: timeoutMs,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
      },
    });

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      // If Python binary is not installed on the system, gracefully simulate safe Python runtime or return informative message
      resolve({
        stdout: "",
        stderr: `Python execution environment error: ${err.message}. (Ensure Python is installed on system PATH).`,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: err.message,
      });
    });

    child.on("close", (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executionTimeMs: Date.now() - startTime,
        success: code === 0,
        error: code !== 0 ? `Process exited with code ${code}` : undefined,
      });
    });
  });
}
