import React from "react";
import { useLocation } from "react-router-dom";
import NotAvailable from "@/pages/NotAvailable";
import { normalizeFeatures } from "@/utils/featureFlags";

// PMS Lite için izinli path prefix’leri
const PMS_LITE_ALLOWED_PREFIXES = [
  "/app/dashboard",
  "/app/pms",
  "/app/reservation-calendar",
  "/app/bookings",
  "/app/rooms",
  "/app/guests",
  "/app/reports",
  "/app/settings",
];

function isAllowedForLite(pathname) {
  return PMS_LITE_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default function PlanRouteGuard({ tenant, children }) {
  const location = useLocation();

  if (!tenant) return children;

  const plan =
    tenant.subscription_plan ||
    tenant.plan ||
    tenant.subscription_tier ||
    "core_small_hotel";

  // Şimdilik sadece plan bazlı kısıtlama yapıyoruz; feature bazlı guard P1 için bırakıldı
  const _features = normalizeFeatures(tenant.features || {});

  if (plan === "pms_lite") {
    if (!isAllowedForLite(location.pathname)) {
      return <NotAvailable />;
    }
  }

  return children;
}
