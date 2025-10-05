import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function HeroSection({ dict }: { dict: any }) {
    return (
        <section className="relative h-[70vh] w-full">
            <Image
              src="https://images.unsplash.com/photo-1581704249122-a0e2a27b872e?q=80&w=2070&auto=format&fit=crop"
              alt="Femme sensuelle dans une ambiance luxueuse"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
                <h1 className="font-headline text-5xl md:text-7xl font-bold drop-shadow-lg">
                    {dict.title}
                </h1>
                <p className="mt-4 max-w-2xl text-lg md:text-xl drop-shadow-md">
                    {dict.subtitle}
                </p>
                <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/auth/register">{dict.cta}</Link>
                </Button>
            </div>
        </section>
    );
}
