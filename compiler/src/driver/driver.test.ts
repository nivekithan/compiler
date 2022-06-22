import { produceExecutable, runExeFileGetOutput } from "./driver";

test("Testing driver", async () => {
  const generatedFile = await produceExecutable(`; ModuleID = 'main'
    source_filename = "main"
    
    define void @main() {
    entry:
      %a = alloca i1, align 1
      %0 = call i1 @printFoo()
      store i1 %0, i1* %a, align 1
      ret void
    }
    
    declare i1 @printFoo()
    `);

  const output = await runExeFileGetOutput(generatedFile);

  expect(output).toEqual("foo\n");
});
