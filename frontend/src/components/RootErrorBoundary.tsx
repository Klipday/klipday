import { DangerTriangleIcon, RefreshIcon } from '@solar-icons/react/linear';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '@/components/ui/button';

/**
 * Global Root Error Boundary component.
 * Catches uncaught runtime errors across route transitions as well as
 * dynamic import / chunk loading failures caused by CDN cache invalidations during new deployments.
 *
 * @returns The rendered fallback error screen with reload and home recovery options.
 */
export function RootErrorBoundary() {
  const error = useRouteError();

  const isChunkError =
    error instanceof Error &&
    (error.message.includes('dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch'));

  /**
   * Reloads the current page to download the latest assets from the server/CDN.
   */
  function HandleReload() {
    window.location.reload();
  }

  /**
   * Navigates the user safely back to the dashboard root.
   */
  function HandleGoHome() {
    window.location.href = '/dashboard';
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <div className="mx-auto max-w-md space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <DangerTriangleIcon className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {isChunkError ? 'Pembaruan Aplikasi Tersedia' : 'Terjadi Gangguan Sistem'}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isChunkError
            ? 'Versi terbaru aplikasi telah dirilis. Silakan muat ulang halaman untuk memperbarui aset.'
            : isRouteErrorResponse(error)
              ? `${error.status} - ${error.statusText}`
              : 'Aplikasi mengalami kesalahan tak terduga. Silakan coba muat ulang halaman.'}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={HandleReload} className="gap-2 font-medium">
            <RefreshIcon className="size-4" />
            <span>Muat Ulang Halaman</span>
          </Button>
          <Button variant="outline" onClick={HandleGoHome} className="font-medium">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
