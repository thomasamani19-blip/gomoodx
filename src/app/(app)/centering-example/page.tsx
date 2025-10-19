
// You can visit this page at /centering-example to see the result.

export default function CenteringExamplePage() {
  return (
    <div className="h-screen w-full bg-muted/20">

      {/* 
        This is the parent container. We give it a specific height 
        (h-96) so you can see the vertical centering in action.
        The key classes are: flex, items-center, and justify-center.
      */}
      <div className="h-96 w-full flex items-center justify-center bg-card border rounded-lg">
        
        {/* This is the child div that will be centered. */}
        <div className="bg-primary text-primary-foreground p-8 rounded-lg shadow-lg">
          <p className="text-xl font-bold">I am centered!</p>
        </div>

      </div>

      <div className="p-8 mt-8 bg-card border rounded-lg">
        <h2 className="text-2xl font-bold mb-4">How it works:</h2>
        <p className="text-muted-foreground">The parent container has the following Tailwind classes:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
          <li><code className="bg-muted px-1 py-0.5 rounded">flex</code>: Turns the container into a flexbox.</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">items-center</code>: Aligns children vertically to the center.</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">justify-center</code>: Aligns children horizontally to the center.</li>
        </ul>
        <p className="mt-4 text-muted-foreground">Another popular method is using CSS Grid with <code className="bg-muted px-1 py-0.5 rounded">grid</code> and <code className="bg-muted px-1 py-0.5 rounded">place-items-center</code> on the parent.</p>
      </div>

    </div>
  );
}
