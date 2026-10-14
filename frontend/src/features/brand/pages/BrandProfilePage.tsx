import { useState } from 'react';
import { Building2, CreditCard } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AddPayoutAccountDialog,
  BrandPayoutAccountsTab,
  BrandProfileHeader,
  BrandProfileInfoForm,
} from '../components';
import {
  UseBrandPayoutAccountsQuery,
  UseBrandProfileQuery,
  UseUploadBrandLogoMutation,
} from '../hooks';

/**
 * Brand Profile & KYC Payout Accounts orchestrator page.
 * Provides a 2-tab layout for managing brand identity and registered payout destination accounts.
 *
 * @returns The rendered BrandProfilePage component.
 */
export default function BrandProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'payout-accounts' ? 'payout-accounts' : 'info';

  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = UseBrandProfileQuery();
  const { data: payoutAccounts = [], isLoading: isAccountsLoading } = UseBrandPayoutAccountsQuery();

  const uploadLogoMutation = UseUploadBrandLogoMutation();

  const HandleTabChange = (val: string) => {
    setSearchParams(val === 'payout-accounts' ? { tab: 'payout-accounts' } : {});
  };

  const HandleLogoUpload = (file: File) => {
    uploadLogoMutation.mutate({ file });
  };

  if (isProfileLoading) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isProfileError || !profile) {
    return (
      <div className="container max-w-5xl py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-destructive">
          Gagal memuat informasi profil brand.
        </p>
        <p className="text-xs text-muted-foreground">
          Silakan muat ulang halaman atau periksa koneksi internet Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Header Profile Banner */}
      <BrandProfileHeader
        profile={profile}
        onLogoUpload={HandleLogoUpload}
        isUploadingLogo={uploadLogoMutation.isPending}
      />

      {/* Main Tabs Segmented Container */}
      <Tabs value={activeTab} onValueChange={HandleTabChange} className="w-full space-y-6">
        <div className="border-b border-border/40 pb-1">
          <TabsList className="bg-transparent p-0 gap-2 h-auto">
            <TabsTrigger
              value="info"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground transition-colors cursor-pointer">
              <Building2 className="size-4" />
              <span>Informasi Brand</span>
            </TabsTrigger>
            <TabsTrigger
              value="payout-accounts"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground transition-colors cursor-pointer">
              <CreditCard className="size-4" />
              <span>Akun Penarikan Saldo</span>
              {payoutAccounts.length > 0 ? (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  {payoutAccounts.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Informasi Brand Form */}
        <TabsContent value="info" className="mt-0 outline-none">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
            <BrandProfileInfoForm profile={profile} />
          </div>
        </TabsContent>

        {/* Tab 2: Akun Penarikan Saldo (KYC) */}
        <TabsContent value="payout-accounts" className="mt-0 outline-none">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
            <BrandPayoutAccountsTab
              accounts={payoutAccounts}
              isLoading={isAccountsLoading}
              onAddAccountClick={() => setIsAddAccountDialogOpen(true)}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Payout Account Modal Dialog */}
      <AddPayoutAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
        existingAccountsCount={payoutAccounts.length}
      />
    </div>
  );
}
