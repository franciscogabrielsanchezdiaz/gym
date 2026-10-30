import "fake-indexeddb/auto";
import Dexie from "dexie";
import { it, expect, afterAll, beforeAll } from "vitest";
import {
  db,
  init,
  backup,
  restore,
  initialProfile,
  initialRoutines,
  startSession,
  type Session,
} from "./model";
beforeAll(async () => {
  const legacy = new Dexie("hypertrophy-v1");
  legacy
    .version(1)
    .stores({
      sessions: "id,date,status,routineId",
      weights: "id,date",
      meals: "id,date",
      routines: "id",
      settings: "id",
      schedule: "id,date,routineId",
    });
  await legacy
    .table("sessions")
    .put({
      id: "legacy",
      routineId: "a",
      name: "Sesión anterior",
      date: "2026-10-28",
      started: 1,
      elapsed: 1000,
      runningSince: null,
      status: "complete",
      entries: [],
      notes: "Conservar",
    });
  legacy.close();
});
it("migra la versión anterior conservando el historial y permite ordenar por started", async () => {
  const sessions = await db.sessions.orderBy("started").reverse().toArray();
  expect(sessions.find((s) => s.id === "legacy")?.notes).toBe("Conservar");
  expect(
    db.sessions.schema.indexes.some((index) => index.name === "started"),
  ).toBe(true);
});
it("dos inicios simultáneos crean una sola sesión activa", async () => {
  const [first, second] = await Promise.all([
    startSession(initialRoutines[0], "2026-10-29"),
    startSession(initialRoutines[0], "2026-10-29"),
  ]);
  expect(first.id).toBe(second.id);
  expect(await db.sessions.where("status").equals("active").count()).toBe(1);
  await db.sessions.delete(first.id);
});
afterAll(async () => {
  await db.delete();
});
it("conserva la sesión al cerrar y reabrir IndexedDB y restaura la copia completa", async () => {
  await init();
  const s: Session = {
    id: "session-test",
    routineId: "a",
    name: "Full Body A",
    date: "2026-10-29",
    started: 1,
    elapsed: 1200,
    runningSince: null,
    status: "active",
    entries: [
      {
        exerciseId: "e0",
        min: 8,
        max: 12,
        notes: "Banco 3",
        sets: [{ kg: 20, reps: 10, rir: 2, done: true, technique: true }],
      },
    ],
    notes: "Prueba",
  };
  await db.sessions.put(s);
  db.close();
  await db.open();
  expect(await db.sessions.get(s.id)).toEqual(s);
  const exported = await backup();
  await db.sessions.clear();
  await restore(JSON.parse(JSON.stringify(exported)));
  expect(await db.sessions.get(s.id)).toEqual(s);
  expect((await db.settings.get("profile"))?.value).toEqual(initialProfile);
});
it("un archivo inválido no modifica los registros existentes", async () => {
  const before = await backup();
  await expect(
    restore({ ...before, weights: [{ id: "bad", date: "hoy", kg: -1 }] }),
  ).rejects.toThrow();
  expect(await backup()).toMatchObject({
    sessions: before.sessions,
    weights: before.weights,
    profile: before.profile,
  });
});
