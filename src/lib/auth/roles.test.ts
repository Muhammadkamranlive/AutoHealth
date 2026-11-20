import { describe, it, expect } from "vitest";
import {
  canApproveOrders,
  canAccessAdminPortal,
  canAccessPartnerPortal,
  canAccessPatientPortal,
} from "./roles";

describe("Role helpers", () => {
  it("physicians and admins can approve orders", () => {
    expect(canApproveOrders("physician")).toBe(true);
    expect(canApproveOrders("admin")).toBe(true);
    expect(canApproveOrders("care_team")).toBe(false);
    expect(canApproveOrders("patient")).toBe(false);
  });

  it("internal roles access admin portal", () => {
    expect(canAccessAdminPortal("physician")).toBe(true);
    expect(canAccessAdminPortal("care_team")).toBe(true);
    expect(canAccessAdminPortal("admin")).toBe(true);
    expect(canAccessAdminPortal("patient")).toBe(false);
    expect(canAccessAdminPortal("partner")).toBe(false);
  });

  it("only patients access patient portal", () => {
    expect(canAccessPatientPortal("patient")).toBe(true);
    expect(canAccessPatientPortal("physician")).toBe(false);
  });

  it("partner roles access partner portal", () => {
    expect(canAccessPartnerPortal("partner")).toBe(true);
    expect(canAccessPartnerPortal("partner_staff")).toBe(true);
    expect(canAccessPartnerPortal("patient")).toBe(false);
  });
});
