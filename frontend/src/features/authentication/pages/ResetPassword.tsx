import { ResetPasswordForm } from '../components';

/**
 * Reset password page orchestrator. Delegates token extraction, URL scrubbing,
 * password validation, and submission to `ResetPasswordForm`.
 *
 * @returns The rendered reset password page.
 */
function ResetPassword() {
  return <ResetPasswordForm />;
}

export default ResetPassword;
