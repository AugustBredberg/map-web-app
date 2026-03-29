"use client";

import { Button } from "@heroui/react";
import type { ProjectCustomer } from "@/lib/supabase";
import { useLocale } from "@/context/LocaleContext";

interface Props {
  siteName: string | null;
  address: string | null;
  customer: ProjectCustomer | null;
  onNavigatePress: () => void;
  canNavigate: boolean;
}

export default function ProjectSiteAndContactCard({
  siteName,
  address,
  customer,
  onNavigatePress,
  canNavigate,
}: Props) {
  const { t } = useLocale();

  return (
    <section className="rounded-2xl border-2 border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{t("projectDetails.siteAndContact")}</h3>
        <Button
          size="sm"
          color="primary"
          variant="solid"
          className="shrink-0 font-semibold"
          isDisabled={!canNavigate}
          onPress={onNavigatePress}
        >
          {t("projectDetails.navigate")}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 text-sm">
          <span className="mt-0.5 shrink-0 text-muted" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.125-7.5 11.25-7.5 11.25S4.5 17.625 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </span>
          <div className="min-w-0">
            {siteName ? <p className="font-semibold text-foreground">{siteName}</p> : null}
            {address ? (
              <p className="text-foreground/90">{address}</p>
            ) : (
              <p className="text-muted">{t("projectDetails.noAddress")}</p>
            )}
          </div>
        </div>

        {customer ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{t("projectDetails.customer")}</p>
            <p className="text-base font-semibold text-foreground">{customer.name}</p>
            <div className="mt-2 flex flex-col gap-2">
              {customer.phone?.trim() ? (
                <a
                  href={`tel:${customer.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <span className="text-muted" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </span>
                  {customer.phone}
                </a>
              ) : null}
              {customer.email?.trim() ? (
                <a
                  href={`mailto:${customer.email.trim()}`}
                  className="inline-flex items-center gap-2 break-all text-sm font-medium text-primary hover:underline"
                >
                  <span className="text-muted" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  {customer.email}
                </a>
              ) : null}
              {!customer.phone?.trim() && !customer.email?.trim() ? (
                <p className="text-sm text-muted">{t("projectDetails.noCustomerContact")}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="border-t border-border pt-3 text-sm text-muted">{t("projectDetails.customerUnavailable")}</p>
        )}
      </div>
    </section>
  );
}
