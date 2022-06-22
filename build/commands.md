To link multiple llvm-ir files

```bash
/lib/llvm-13/bin/llvm-link driver.ll fn.ll -o single.ll -S
```

To generate a executable

```bash
/lib/llvm-13/bin/llc single.ll -s single.s
gcc single.s -o single.out
```
