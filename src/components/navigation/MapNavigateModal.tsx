"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react";
import { useLocale } from "@/context/LocaleContext";
import {
  appleMapsDirectionsUrl,
  appleMapsDirectionsUrlFromAddress,
  googleMapsDirectionsUrl,
  googleMapsDirectionsUrlFromAddress,
} from "@/lib/navigationUrls";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Shown as secondary line under the title */
  destinationLabel: string;
  lat: number | null;
  lng: number | null;
  /** Used when coordinates are missing */
  addressFallback: string | null;
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.125-7.5 11.25-7.5 11.25S4.5 17.625 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

export default function MapNavigateModal({
  isOpen,
  onClose,
  destinationLabel,
  lat,
  lng,
  addressFallback,
}: Props) {
  const { t } = useLocale();
  const hasCoords = lat !== null && lng !== null;
  const addr = addressFallback?.trim() ?? "";

  const googleUrl = hasCoords
    ? googleMapsDirectionsUrl(lat!, lng!)
    : addr
      ? googleMapsDirectionsUrlFromAddress(addr)
      : "";
  const appleUrl = hasCoords
    ? appleMapsDirectionsUrl(lat!, lng!)
    : addr
      ? appleMapsDirectionsUrlFromAddress(addr)
      : "";

  const canOpen = Boolean(googleUrl && appleUrl);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" placement="bottom-center" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-1">
          <span>{t("navigation.openInMaps")}</span>
          <span className="text-sm font-normal text-muted line-clamp-2">{destinationLabel}</span>
        </ModalHeader>
        <ModalBody className="gap-3 pb-6">
          {!canOpen ? (
            <p className="text-sm text-muted">{t("navigation.noDestination")}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{t("navigation.pickAppHint")}</p>
              <Button
                size="lg"
                className="h-14 justify-start gap-3 text-base font-semibold"
                variant="bordered"
                onPress={() => {
                  openExternal(googleUrl);
                  onClose();
                }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400" aria-hidden>
                  <MapPinIcon className="h-6 w-6" />
                </span>
                Google Maps
              </Button>
              <Button
                size="lg"
                className="h-14 justify-start gap-3 text-base font-semibold"
                variant="bordered"
                onPress={() => {
                  openExternal(appleUrl);
                  onClose();
                }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-500/15 text-foreground" aria-hidden>
                  <MapPinIcon className="h-6 w-6" />
                </span>
                Apple Maps
              </Button>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
