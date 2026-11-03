import { describe, expect, it } from "vitest";
import { canAccessTicket, canOpenTickets, nextStatusAfterReply } from "./rules";

const EST = "est-1";
const ticket = { created_by: "u-teacher", establishment_id: EST };

describe("support rules", () => {
  it("réserve l'ouverture de tickets au personnel", () => {
    expect(canOpenTickets("director")).toBe(true);
    expect(canOpenTickets("teacher")).toBe(true);
    expect(canOpenTickets("owner")).toBe(true);
    expect(canOpenTickets("parent")).toBe(false);
    expect(canOpenTickets("student")).toBe(false);
    expect(canOpenTickets("super_admin")).toBe(false);
    expect(canOpenTickets(undefined)).toBe(false);
  });

  it("donne accès au super-admin, à l'auteur et au directeur de l'établissement", () => {
    expect(canAccessTicket({ userId: "sa", role: "super_admin", establishmentId: null }, ticket)).toBe(true);
    expect(canAccessTicket({ userId: "u-teacher", role: "teacher", establishmentId: EST }, ticket)).toBe(true);
    expect(canAccessTicket({ userId: "u-dir", role: "director", establishmentId: EST }, ticket)).toBe(true);
  });

  it("refuse les autres comptes", () => {
    expect(canAccessTicket({ userId: "u-other", role: "teacher", establishmentId: EST }, ticket)).toBe(false);
    expect(canAccessTicket({ userId: "u-dir2", role: "director", establishmentId: "est-2" }, ticket)).toBe(false);
    expect(canAccessTicket({ userId: "u-teacher", role: "parent", establishmentId: EST }, ticket)).toBe(false);
    expect(canAccessTicket({ userId: "u-dir", role: "director", establishmentId: null }, { ...ticket, establishment_id: null })).toBe(false);
  });

  it("calcule le statut après une réponse", () => {
    expect(nextStatusAfterReply(true)).toBe("pending");
    expect(nextStatusAfterReply(false)).toBe("open");
  });
});
