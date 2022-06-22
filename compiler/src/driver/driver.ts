import path from "path";
import { writeFile } from "fs/promises";
import { promisify } from "util";
import childProcess, { execFile } from "child_process";

const exec = promisify(childProcess.exec);

export const produceExecutable = async (llvmIr: string): Promise<string> => {
  const buildPath = path.join(process.cwd(), "build");

  const generatedIrFile = path.join(buildPath, "driver.ll");

  await writeFile(generatedIrFile, llvmIr);

  const linkedCompilerFile = path.join(buildPath, "linked.ll");

  await exec(
    `${getLLVMLinkPath()} ${generatedIrFile} ${getCompilerProvidedFnPath()} -o ${linkedCompilerFile}`
  );

  const generatedAsmFile = path.join(buildPath, "linked.s");

  await exec(`${getLLCPath()} ${linkedCompilerFile} -o ${generatedAsmFile}`);

  const generatedExeFile = path.join(buildPath, "final.out");

  await exec(`gcc ${generatedAsmFile} -o ${generatedExeFile}`);

  return generatedExeFile;
};

export const runExeFileGetOutput = async (filePath: string) => {
  try {
    const { stdout } = await exec(filePath);
    return stdout;
  } catch (err: any) {
    /**
     * For some reason exce is failing but in the err, the correct `stdout` is
     * avaliable. I have no idea why this is happening
     */
    return err.stdout as string;
  }
};

const getCompilerProvidedFnPath = () => {
  return path.join(
    process.cwd(),
    "compiler",
    "src",
    "compilerProvidedFn",
    "fn.ll"
  );
};

const getLLVMLinkPath = () => {
  return path.join("/", "lib", "llvm-13", "bin", "llvm-link");
};

const getLLCPath = () => {
  return path.join("/", "lib", "llvm-13", "bin", "llc");
};


