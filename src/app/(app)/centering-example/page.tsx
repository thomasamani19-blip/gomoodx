'use client';

export default function CenteringExamplePage() {
  return (
    // To center something on the whole page, the parent needs a defined height.
    // Here, `h-screen` makes the parent take up the full viewport height.
    <div className="flex h-screen items-center justify-center bg-muted/20">
      
      {/* This is the div that is being centered */}
      <div className="w-1/2 rounded-lg bg-card p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">I am a centered div!</h1>
        <p className="mt-2 text-muted-foreground">
          My parent has the classes: <code className="font-mono text-primary">flex items-center justify-center</code>
        </p>
      </div>

    </div>
  );
}
