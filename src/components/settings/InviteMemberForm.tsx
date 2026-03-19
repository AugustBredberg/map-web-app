"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { createInvitation } from "@/lib/invitations";
import { useLocale } from "@/context/LocaleContext";

interface Props {
  organizationId: string;
  invitedBy: string;
  onInvited: () => void;
}

export default function InviteMemberForm({ organizationId, invitedBy, onInvited }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { t } = useLocale();

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: inviteError } = await createInvitation(organizationId, email.trim().toLowerCase(), invitedBy);
    setLoading(false);

    if (inviteError) {
      setError(inviteError);
      return;
    }

    setEmail("");
    setSuccess(true);
    onInvited();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={t("inviteMember.emailPlaceholder")}
          variant="bordered"
          autoComplete="off"
          data-bwignore="true"
          value={email}
          onValueChange={(v) => {
            setEmail(v);
            setSuccess(false);
          }}
          size="sm"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button
          color="primary"
          size="sm"
          isLoading={loading}
          isDisabled={!email.trim()}
          onPress={handleSubmit}
        >
          {t("inviteMember.invite")}
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {success && <p className="text-xs text-success">{t("inviteMember.invitationSent")}</p>}
    </div>
  );
}
