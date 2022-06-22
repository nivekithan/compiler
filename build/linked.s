	.text
	.file	"llvm-link"
	.globl	main                            # -- Begin function main
	.p2align	4, 0x90
	.type	main,@function
main:                                   # @main
	.cfi_startproc
# %bb.0:                                # %entry
	pushq	%rax
	.cfi_def_cfa_offset 16
	callq	printFoo@PLT
	andb	$1, %al
	movb	%al, 7(%rsp)
	popq	%rax
	.cfi_def_cfa_offset 8
	retq
.Lfunc_end0:
	.size	main, .Lfunc_end0-main
	.cfi_endproc
                                        # -- End function
	.globl	printFoo                        # -- Begin function printFoo
	.p2align	4, 0x90
	.type	printFoo,@function
printFoo:                               # @printFoo
	.cfi_startproc
# %bb.0:                                # %entry
	movl	$175075174, -4(%rsp)            # imm = 0xA6F6F66
	leaq	-4(%rsp), %rsi
	movl	$1, %eax
	movl	$1, %edi
	movl	$4, %edx
	#APP
	syscall
	#NO_APP
	movb	$1, %al
	retq
.Lfunc_end1:
	.size	printFoo, .Lfunc_end1-printFoo
	.cfi_endproc
                                        # -- End function
	.section	".note.GNU-stack","",@progbits
