import { ForgotPasswordForm } from '../components';

/**
 * Forgot password page orchestrator. Delegates email validation, submission,
 * and confirmation resend cooldown to `ForgotPasswordForm`.
 *
 * @returns The rendered forgot password page.
 */
function ForgotPassword() {
  return <ForgotPasswordForm />;
}

export default ForgotPassword;
