import { CreditCard, Share2, User } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UseCreatorPayoutAccountsQuery } from '@/features/wallet/hooks';
import {
  CreatorPayoutAccountsTab,
  CreatorProfileErrorState,
  CreatorProfileHeader,
  CreatorProfileInfoForm,
  CreatorProfileSkeleton,
  CreatorSocialAccountsTab,
} from '../components';
import {
  UseCreatorProfileQuery,
  UseUploadCreatorAvatarMutation,
} from '../hooks';

/**
 * Creator Profile & KYC Payout Accounts orchestrator page.
 * Provides a 3-tab layout: Informasi Pribadi, Akun Sosial, and Akun Penarikan Saldo.
 * Synchronizes active tab selection with the `?tab=` URL search parameter.
 *
 * @returns The rendered CreatorProfilePage component.
 */
export default function CreatorProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab =
    rawTab === 'social-accounts' || rawTab === 'payout-accounts' ? rawTab : 'info';

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch,
  } = UseCreatorProfileQuery();

  const { data: payoutAccounts = [] } = UseCreatorPayoutAccountsQuery();
  const uploadAvatarMutation = UseUploadCreatorAvatarMutation();

  const HandleTabChange = (val: string) => {
    setSearchParams(val === 'info' ? {} : { tab: val });
  };

  const HandleAvatarUpload = (file: File) => {
    uploadAvatarMutation.mutate({ file });
  };

  if (isProfileLoading) {
    return <CreatorProfileSkeleton />;
  }

  if (isProfileError || !profile) {
    return (
      <div className="container max-w-5xl py-12">
        <CreatorProfileErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Header Profile Banner */}
      <CreatorProfileHeader
        profile={profile}
        onAvatarUpload={HandleAvatarUpload}
        isUploadingAvatar={uploadAvatarMutation.isPending}
      />

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={HandleTabChange} className="w-full space-y-6">
        <div className="border-b border-border/40 pb-1">
          <TabsList className="bg-transparent p-0 gap-2 h-auto">
            <TabsTrigger
              value="info"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground transition-colors cursor-pointer">
              <User className="size-4" />
              <span>Informasi Pribadi</span>
            </TabsTrigger>
            <TabsTrigger
              value="social-accounts"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground transition-colors cursor-pointer">
              <Share2 className="size-4" />
              <span>Akun Sosial</span>
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

        {/* Tab 1: Informasi Pribadi Form */}
        <TabsContent value="info" className="mt-0 outline-none">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
            <CreatorProfileInfoForm profile={profile} />
          </div>
        </TabsContent>

        {/* Tab 2: Akun Sosial */}
        <TabsContent value="social-accounts" className="mt-0 outline-none">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
            <CreatorSocialAccountsTab
              tiktokAccount={profile.tiktokAccount}
              onAccountChangeSuccess={() => refetch()}
            />
          </div>
        </TabsContent>

        {/* Tab 3: Akun Penarikan Saldo */}
        <TabsContent value="payout-accounts" className="mt-0 outline-none">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
            <CreatorPayoutAccountsTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
