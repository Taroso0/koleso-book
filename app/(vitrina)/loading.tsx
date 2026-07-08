import { SystemLoader } from "@/components/haunted/SystemLoader";

// Suspense-фолбэк «Витрины» — виден в основном на стриминге/медленной сети (SSG+prefetch).
export default function Loading() {
  return <SystemLoader />;
}
