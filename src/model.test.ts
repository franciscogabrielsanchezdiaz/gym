import { describe, it, expect } from "vitest";
import {
  progression,
  validateBackup,
  initialProfile,
  initialRoutines,
  csv,
  volume,
  kg,
  lb,
  type Entry,
  type Backup,
} from "./model";
const entry = (reps = 12, rir = 2, technique = true, done = true): Entry => ({
  exerciseId: "e0",
  min: 8,
  max: 12,
  notes: "",
  sets: [
    { kg: 20, reps, rir, technique, done },
    { kg: 20, reps, rir, technique, done },
  ],
});
const valid = (): Backup => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  profile: initialProfile,
  routines: initialRoutines,
  sessions: [],
  weights: [],
  meals: [],
  schedule: [],
});
describe("progresión doble", () => {
  it("sugiere el incremento disponible sin mutar el registro", () => {
    const e = entry();
    expect(progression(e).suggested).toBe(22.5);
    expect(e.sets[0].kg).toBe(20);
  });
  it("exige todas las series completadas", () =>
    expect(progression(entry(12, 2, true, false)).suggested).toBeNull());
  it("no sube con técnica deficiente ni al fallo", () => {
    expect(progression(entry(12, 0)).suggested).toBeNull();
    expect(progression(entry(12, 2, false)).suggested).toBeNull();
  });
  it("propone reducir cuando todas quedan por debajo del mínimo", () =>
    expect(progression(entry(6)).suggested).toBe(17.5));
  it("detecta récord de repeticiones", () =>
    expect(progression(entry(11), entry(10)).message).toContain("récord"));
  it("no suma series pendientes al volumen", () =>
    expect(volume([entry(12, 2, true, false)])).toBe(0));
  it("no sugiere subir si hay una serie por debajo del tope", () => {
    const e = entry();
    e.sets[1].reps = 11;
    expect(progression(e).suggested).toBeNull();
  });
});
describe("copias", () => {
  it("exportación/importación conserva estructura JSON", () => {
    const b = valid();
    expect(validateBackup(JSON.parse(JSON.stringify(b)))).toEqual(b);
  });
  it("rechaza versiones incompatibles", () =>
    expect(() => validateBackup({ ...valid(), version: 9 })).toThrow());
  it("rechaza pesos inválidos", () =>
    expect(() =>
      validateBackup({
        ...valid(),
        weights: [{ id: "x", date: "2026-10-29", kg: -3 }],
      }),
    ).toThrow());
  it("rechaza IDs duplicados", () => {
    const b = valid();
    b.routines = [b.routines[0], b.routines[0]];
    expect(() => validateBackup(b)).toThrow();
  });
  it("rechaza ejercicios desconocidos", () => {
    const b = structuredClone(valid());
    b.routines[0].items[0].exerciseId = "inexistente";
    expect(() => validateBackup(b)).toThrow();
  });
  it("rechaza datos incompletos", () =>
    expect(() => validateBackup({ version: 1 })).toThrow());
  it("escapa CSV y protege fórmulas", () => {
    const output = csv([
      {
        id: "s",
        routineId: "a",
        name: "=HYPER",
        date: "2026-10-29",
        started: 1,
        elapsed: 1,
        runningSince: null,
        status: "complete",
        notes: "",
        entries: [{ ...entry(), notes: 'dice "hola", bien' }],
      },
    ]);
    expect(output).toContain('"\'=HYPER"');
    expect(output).toContain('"dice ""hola"", bien"');
  });
});
it("convierte kg/lb sin deriva", () => expect(kg(lb(68))).toBeCloseTo(68, 8));
