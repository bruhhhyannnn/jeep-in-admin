'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { auth } from '@/lib';
import { useAuthStore, useSidebarStore } from '@/store';
import { useOrganization } from '@/hooks';
import { Button, PanelValue, SidePanel } from '@/components/ui';
import { Avatar } from '@/components/common';
import { useSignOut } from '@/components/auth';

/** My profile — opens over whatever page you were on; closing drops you back there. */
export function ProfilePanel() {
  const { isProfileOpen, closeProfile } = useSidebarStore();
  const { user, userProfile } = useAuthStore();
  const signOut = useSignOut();
  const [sending, setSending] = useState(false);

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const { data: org } = useOrganization(userProfile?.organizationId || undefined);

  const email = user?.email ?? userProfile?.email ?? '';
  const displayName = userProfile?.firstName
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : (email.split('@')[0] ?? 'Manager');
  const roleLabel = isSuperAdmin ? 'Super admin' : 'Admin';
  const signedInAt = user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;

  const sendReset = async () => {
    if (!email) return;
    setSending(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Reset link sent to ${email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send the reset link');
    } finally {
      setSending(false);
    }
  };

  return (
    <SidePanel
      isOpen={isProfileOpen}
      onClose={closeProfile}
      title="My profile"
      subtitle={`${roleLabel}${org ? ` · ${org.name}` : ''}`}
      footer={
        <Button variant="outline" onClick={closeProfile}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="lg" tone="solid" />
          <div className="min-w-0">
            <p className="text-ink truncate text-[17px] font-bold">{displayName}</p>
            <p className="text-ink-muted truncate text-[13px]">{email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PanelValue label="First name">{userProfile?.firstName || '—'}</PanelValue>
          <PanelValue label="Last name">{userProfile?.lastName || '—'}</PanelValue>
          <PanelValue label="Email">{email || '—'}</PanelValue>
          <PanelValue label="Organization">
            {isSuperAdmin ? 'All organizations' : (org?.name ?? userProfile?.organizationId ?? '—')}
          </PanelValue>
        </div>
        <p className="text-ink-muted text-[13px]">
          Name and organization are managed by a super admin.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="border-line rounded-tile flex flex-col gap-3 border-[1.5px] p-4">
            <div>
              <p className="text-ink text-[14px] font-bold">Password</p>
              <p className="text-ink-muted mt-0.5 text-[13px]">
                We email you a link to set a new one.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={sendReset}
              isLoading={sending}
              loadingText="Sending…"
              className="mt-auto"
            >
              Email me a reset link
            </Button>
          </div>
          <div className="border-line rounded-tile flex flex-col gap-3 border-[1.5px] p-4">
            <div>
              <p className="text-ink text-[14px] font-bold">This computer</p>
              <p className="text-ink-muted mt-0.5 text-[13px]">
                {signedInAt
                  ? `Signed in since ${format(signedInAt, 'MMM d · h:mm a')}`
                  : 'Signed in'}
              </p>
            </div>
            <Button variant="danger-outline" size="sm" onClick={signOut} className="mt-auto">
              Log out
            </Button>
          </div>
        </div>
      </div>
    </SidePanel>
  );
}
