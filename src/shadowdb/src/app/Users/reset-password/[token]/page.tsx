import { use } from 'react';
import ResetPasswordPage from './component/ResetPasswordPage';

// This is the correct way to receive params in Next.js 15
export default function ServerResetPasswordPage({
  params
}: {
  params: any
}) {
  // Now token is accessible from params.token
  const { token } = params;

  return <ResetPasswordPage token={token} />;
}
