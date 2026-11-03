import { describe, expect, it } from "vitest";
import {
  applyEstablishmentScope,
  canSeeStudent,
  decideEstablishmentScope,
  filterRowsByStudentScope,
  isStudentScopedRole,
} from "./establishment-access";

describe("decideEstablishmentScope", () => {
  it("filtre sur l'établissement résolu quand il y en a un", () => {
    expect(decideEstablishmentScope({ role: "director", resolvedId: "est-1" })).toEqual({
      kind: "ids",
      ids: ["est-1"],
    });
  });

  it("ne renvoie JAMAIS « tout » à un rôle verrouillé sans établissement (régression : fuite inter-écoles)", () => {
    for (const role of ["director", "teacher", "accountant", "secretary", "parent", "student"]) {
      expect(decideEstablishmentScope({ role, resolvedId: null })).toEqual({ kind: "none" });
    }
  });

  it("refuse tout sans rôle", () => {
    expect(decideEstablishmentScope({ role: undefined, resolvedId: "est-1" })).toEqual({ kind: "none" });
  });

  it("donne la vue globale au super_admin sans établissement choisi", () => {
    expect(decideEstablishmentScope({ role: "super_admin", resolvedId: null })).toEqual({ kind: "all" });
  });

  it("propriétaire sans établissement actif : uniquement ses établissements", () => {
    expect(
      decideEstablishmentScope({ role: "owner", resolvedId: null, ownedIds: ["est-1", "est-2"] })
    ).toEqual({ kind: "ids", ids: ["est-1", "est-2"] });
  });

  it("propriétaire qui demande l'établissement d'un autre : rien (pas d'élargissement à ses écoles)", () => {
    expect(
      decideEstablishmentScope({
        role: "owner",
        resolvedId: null,
        explicitId: "est-autre",
        ownedIds: ["est-1"],
      })
    ).toEqual({ kind: "none" });
  });

  it("propriétaire sans aucun établissement : rien", () => {
    expect(decideEstablishmentScope({ role: "owner", resolvedId: null, ownedIds: [] })).toEqual({
      kind: "none",
    });
  });

  it("une valeur sentinelle (« global ») n'est pas une demande explicite", () => {
    expect(
      decideEstablishmentScope({ role: "owner", resolvedId: null, explicitId: "global", ownedIds: ["est-1"] })
    ).toEqual({ kind: "ids", ids: ["est-1"] });
  });
});

describe("applyEstablishmentScope", () => {
  const fakeQuery = () => {
    const calls: unknown[][] = [];
    const q = {
      calls,
      eq(...a: unknown[]) { calls.push(["eq", ...a]); return q; },
      in(...a: unknown[]) { calls.push(["in", ...a]); return q; },
    };
    return q;
  };

  it("n'ajoute aucun filtre pour all", () => {
    const q = fakeQuery();
    applyEstablishmentScope(q, { kind: "all" });
    expect(q.calls).toEqual([]);
  });

  it("utilise eq pour un seul établissement et in pour plusieurs", () => {
    const one = fakeQuery();
    applyEstablishmentScope(one, { kind: "ids", ids: ["a"] });
    expect(one.calls).toEqual([["eq", "establishment_id", "a"]]);

    const many = fakeQuery();
    applyEstablishmentScope(many, { kind: "ids", ids: ["a", "b"] });
    expect(many.calls).toEqual([["in", "establishment_id", ["a", "b"]]]);
  });
});

describe("périmètre élèves", () => {
  it("seuls parent et élève sont restreints", () => {
    expect(isStudentScopedRole("parent")).toBe(true);
    expect(isStudentScopedRole("student")).toBe(true);
    expect(isStudentScopedRole("teacher")).toBe(false);
    expect(isStudentScopedRole(undefined)).toBe(false);
  });

  it("canSeeStudent : un parent ne voit que ses enfants", () => {
    const scope = { kind: "ids" as const, ids: ["enfant-1"] };
    expect(canSeeStudent(scope, "enfant-1")).toBe(true);
    expect(canSeeStudent(scope, "autre-eleve")).toBe(false);
    expect(canSeeStudent(scope, null)).toBe(false);
    expect(canSeeStudent({ kind: "all" }, "autre-eleve")).toBe(true);
  });

  it("filterRowsByStudentScope retire les lignes des autres élèves", () => {
    const rows = [{ student_id: "a" }, { student_id: "b" }, { student_id: null }];
    expect(filterRowsByStudentScope(rows, { kind: "ids", ids: ["a"] })).toEqual([{ student_id: "a" }]);
    expect(filterRowsByStudentScope(rows, { kind: "ids", ids: [] })).toEqual([]);
    expect(filterRowsByStudentScope(rows, { kind: "all" })).toHaveLength(3);
  });
});
