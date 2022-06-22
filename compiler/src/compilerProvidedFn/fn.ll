define i1 @printFoo() {
entry:
    %0 = alloca [4 x i8], align 1
    %1 = getelementptr [4 x i8], [4 x i8]* %0, i64 0, i32 0
    store i8 102, i8* %1, align 1
    %2 = getelementptr [4 x i8], [4 x i8]* %0, i64 0, i32 1
    store i8 111, i8* %2, align 1
    %3 = getelementptr [4 x i8], [4 x i8]* %0, i64 0, i32 2
    store i8 111, i8* %3, align 1
    %4 = getelementptr [4 x i8], [4 x i8]* %0, i64 0, i32 3
    store i8 10, i8* %4, align 1   
    call void asm sideeffect "syscall", "{rax},{rdi},{rsi},{rdx}"(i64 1, i64 1, i8* %1, i64 4)
    ret i1 true
}