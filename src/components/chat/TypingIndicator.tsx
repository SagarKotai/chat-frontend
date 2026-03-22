export function TypingIndicator(): JSX.Element {
  return (
    <div className='flex items-center gap-1 py-1'>
      <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]'></span>
      <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]'></span>
      <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60'></span>
    </div>
  );
}
