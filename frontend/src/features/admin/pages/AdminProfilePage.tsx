import {
  AdminChangePasswordForm,
  AdminProfileErrorState,
  AdminProfileHeader,
  AdminProfileInfoForm,
  AdminProfileSkeleton,
} from '../components';
import { UseAdminProfileQuery } from '../hooks';

/**
 * Pure orchestrator page rendering the authenticated administrator's profile and security settings.
 *
 * @returns The rendered administrator profile page with loading and error recovery states.
 */
export default function AdminProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = UseAdminProfileQuery();

  if (isLoading) {
    return <AdminProfileSkeleton />;
  }

  if (isError || !profile) {
    return (
      <AdminProfileErrorState
        message={error?.message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <AdminProfileHeader profile={profile} />
      <AdminProfileInfoForm profile={profile} />
      <AdminChangePasswordForm />
    </div>
  );
}
