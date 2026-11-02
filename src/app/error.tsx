"use client"; // Error boundaries must be Client Components

import { RouteError } from "@/components/common/route-error";

export default function RootError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <RouteError {...props} />
    </main>
  );
}
