"use client"; // Error boundaries must be Client Components

import { RouteError } from "@/components/common/route-error";

// Rendu à l'intérieur du layout du dashboard : la sidebar et la navbar
// restent visibles, seule la zone de contenu est remplacée.
export default function DashboardError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <RouteError {...props} />;
}
