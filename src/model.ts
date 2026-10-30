import Dexie, { type Table } from "dexie";
export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  secondary: string;
  equipment: string;
  steps: string[];
  errors: string;
  alternatives: string[];
  compound: boolean;
  increment: number;
};
export type PlanItem = {
  exerciseId: string;
  sets: number;
  min: number;
  max: number;
};
export type Routine = {
  id: string;
  name: string;
  day: number;
  items: PlanItem[];
};
export type SetLog = {
  kg: number;
  reps: number;
  rir: number;
  done: boolean;
  technique: boolean;
};
export type Entry = {
  exerciseId: string;
  min: number;
  max: number;
  sets: SetLog[];
  notes: string;
};
export type Session = {
  id: string;
  routineId: string;
  name: string;
  date: string;
  started: number;
  ended?: number;
  elapsed: number;
  runningSince: number | null;
  entries: Entry[];
  notes: string;
  status: "active" | "complete";
  restEnd?: number;
};
export type Weight = { id: string; date: string; kg: number };
export type Meal = {
  id: string;
  date: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  favorite: boolean;
};
export type Profile = {
  name: string;
  startKg: number;
  goalKg: number;
  height: number;
  calories: number;
  protein: number;
  unit: "kg" | "lb";
  tutorial: boolean;
  increments: Record<string, number>;
};
export type Schedule = { id: string; routineId: string; date: string };
export const uid = () => crypto.randomUUID();
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const lb = (kg: number) => kg * 2.2046226218;
export const kg = (pounds: number) => pounds / 2.2046226218;
const raw: [string, string, string, string, boolean][] = [
  [
    "Press de pecho en máquina",
    "Pecho",
    "Tríceps · Hombros",
    "Máquina de pecho",
    true,
  ],
  ["Jalón al pecho", "Espalda", "Bíceps", "Polea alta", true],
  ["Prensa de piernas", "Cuádriceps", "Glúteos", "Prensa", true],
  ["Elevaciones laterales", "Hombros", "Trapecio", "Mancuernas", false],
  ["Curl de bíceps", "Bíceps", "Antebrazos", "Mancuernas o polea", false],
  ["Extensión de tríceps en polea", "Tríceps", "Antebrazos", "Polea", false],
  ["Remo sentado", "Espalda", "Bíceps", "Polea baja", true],
  [
    "Press inclinado de pecho",
    "Pecho",
    "Hombros · Tríceps",
    "Banco inclinado y mancuernas",
    true,
  ],
  [
    "Curl femoral en máquina",
    "Isquiotibiales",
    "Gemelos",
    "Máquina femoral",
    false,
  ],
  ["Press de hombros", "Hombros", "Tríceps", "Máquina o mancuernas", true],
  [
    "Extensión de cuádriceps",
    "Cuádriceps",
    "Recto femoral",
    "Máquina de extensión",
    false,
  ],
  ["Curl martillo", "Bíceps", "Braquial · Antebrazos", "Mancuernas", false],
  [
    "Press plano con mancuernas",
    "Pecho",
    "Tríceps · Hombros",
    "Banco y mancuernas",
    true,
  ],
  [
    "Remo con apoyo de pecho",
    "Espalda",
    "Bíceps · Hombros posteriores",
    "Banco inclinado y mancuernas",
    true,
  ],
  ["Sentadilla Hack", "Cuádriceps", "Glúteos", "Máquina Hack", true],
  [
    "Aperturas inversas en máquina",
    "Hombros",
    "Espalda alta",
    "Máquina de aperturas",
    false,
  ],
  [
    "Extensión de tríceps sobre la cabeza",
    "Tríceps",
    "Estabilizadores del hombro",
    "Polea o mancuerna",
    false,
  ],
];
const cues = [
  [
    "Ajusta el asiento con los agarres a la altura del pecho.",
    "Apoya la espalda y empuja sin bloquear los codos.",
    "Vuelve despacio manteniendo los hombros abajo.",
  ],
  [
    "Sujeta la barra algo más ancha que los hombros.",
    "Lleva los codos hacia las costillas y la barra al pecho alto.",
    "Extiende los brazos con control, sin balancearte.",
  ],
  [
    "Coloca los pies al ancho de hombros y apoya la espalda.",
    "Baja hasta donde puedas mantener la pelvis apoyada.",
    "Empuja con todo el pie, sin bloquear las rodillas.",
  ],
  [
    "De pie, flexiona ligeramente los codos.",
    "Eleva los brazos hacia los lados hasta la altura del hombro.",
    "Baja despacio sin encoger los hombros.",
  ],
  [
    "Mantén los codos junto al torso y el abdomen firme.",
    "Flexiona los codos sin mover los hombros.",
    "Baja controlando hasta extender los brazos.",
  ],
  [
    "Fija los codos junto al cuerpo.",
    "Extiende los brazos hacia abajo sin mover el torso.",
    "Regresa despacio manteniendo tensión.",
  ],
  [
    "Siéntate erguido con el pecho alto.",
    "Lleva los agarres hacia el abdomen con los codos cerca.",
    "Vuelve sin redondear la espalda.",
  ],
  [
    "Ajusta el banco a 15–30 grados.",
    "Baja las mancuernas a los lados del pecho.",
    "Empuja hacia arriba manteniendo los omóplatos apoyados.",
  ],
  [
    "Alinea las rodillas con el eje de la máquina.",
    "Flexiona las rodillas sin despegar la cadera.",
    "Regresa despacio sin soltar la carga.",
  ],
  [
    "Ajusta el asiento, con agarres a la altura del hombro.",
    "Empuja hacia arriba sin arquear la espalda.",
    "Baja con control dentro de un recorrido cómodo.",
  ],
  [
    "Alinea la rodilla con el eje y el rodillo sobre el tobillo.",
    "Extiende las rodillas sin levantar las caderas.",
    "Baja lentamente sin golpear las placas.",
  ],
  [
    "Sujeta las mancuernas con las palmas enfrentadas.",
    "Flexiona los codos sin balancear el torso.",
    "Baja despacio manteniendo las muñecas neutras.",
  ],
  [
    "Apoya pies, glúteos y espalda sobre el banco.",
    "Baja las mancuernas con los codos a unos 45 grados.",
    "Empuja hacia arriba sin chocar las mancuernas.",
  ],
  [
    "Apoya el pecho en un banco inclinado.",
    "Tira de las mancuernas hacia las caderas.",
    "Baja controlando sin despegar el pecho.",
  ],
  [
    "Apoya espalda y hombros y coloca los pies firmes.",
    "Desbloquea la máquina y flexiona rodillas en un recorrido cómodo.",
    "Empuja sin bloquear las rodillas.",
  ],
  [
    "Ajusta el asiento y apoya el pecho.",
    "Abre los brazos sin encoger los hombros.",
    "Regresa con control manteniendo una ligera flexión de codos.",
  ],
  [
    "Eleva los brazos y mantén los codos estables.",
    "Flexiona los codos llevando la carga detrás de la cabeza.",
    "Extiende sin arquear la espalda.",
  ],
];
export const exercises: Exercise[] = raw.map((r, i) => ({
  id: `e${i}`,
  name: r[0],
  muscle: r[1],
  secondary: r[2],
  equipment: r[3],
  compound: r[4],
  steps: cues[i],
  errors:
    "Evita el impulso, contener la respiración y usar un recorrido doloroso. Reduce la carga si pierdes el control.",
  alternatives: [],
  increment: r[4] ? 2.5 : 1,
}));
const alternatives = [
  [12, 7],
  [6, 13],
  [14, 10],
  [9, 15],
  [11],
  [16],
  [13, 1],
  [0, 12],
  [2],
  [3],
  [2, 14],
  [4],
  [0, 7],
  [6],
  [2, 10],
  [3],
  [5],
];
exercises.forEach(
  (e, i) => (e.alternatives = alternatives[i].map((n) => `e${n}`)),
);
const item = (n: number, min = 8, max = 12): PlanItem => ({
  exerciseId: `e${n}`,
  sets: 2,
  min,
  max,
});
export const initialRoutines: Routine[] = [
  {
    id: "a",
    name: "Full Body A",
    day: 1,
    items: [
      item(0),
      item(1),
      item(2, 10),
      item(3, 12, 15),
      item(4, 10),
      item(5, 10),
    ],
  },
  {
    id: "b",
    name: "Full Body B",
    day: 3,
    items: [
      item(6),
      item(7),
      item(8, 10, 15),
      item(9),
      item(10, 10, 15),
      item(11, 10),
    ],
  },
  {
    id: "c",
    name: "Full Body C",
    day: 5,
    items: [
      item(12),
      item(13),
      item(14),
      item(15, 12, 15),
      item(4, 10),
      item(16, 10),
    ],
  },
];
export const initialProfile: Profile = {
  name: "Atleta",
  startKg: kg(150),
  goalKg: kg(180),
  height: 188,
  calories: 2900,
  protein: 130,
  unit: "lb",
  tutorial: false,
  increments: {},
};
class GymDB extends Dexie {
  sessions!: Table<Session, string>;
  weights!: Table<Weight, string>;
  meals!: Table<Meal, string>;
  routines!: Table<Routine, string>;
  settings!: Table<{ id: string; value: Profile }, string>;
  schedule!: Table<Schedule, string>;
  constructor() {
    super("hypertrophy-v1");
    this.version(1).stores({
      sessions: "id,date,status,routineId",
      weights: "id,date",
      meals: "id,date",
      routines: "id",
      settings: "id",
      schedule: "id,date,routineId",
    });
    // Add the index used by the dashboard without replacing existing records.
    this.version(2).stores({ sessions: "id,date,status,routineId,started" });
  }
}
export const db = new GymDB();
export async function init() {
  await db.transaction("rw", db.routines, db.settings, async () => {
    if (!(await db.settings.get("profile"))) {
      await db.settings.put({ id: "profile", value: initialProfile });
      await db.routines.bulkPut(initialRoutines);
    }
  });
}
// Serialize session creation across double taps and other tabs.
export async function startSession(
  routine: Routine,
  date: string,
  now = Date.now(),
): Promise<Session> {
  return db.transaction("rw", db.sessions, async () => {
    const active = await db.sessions.where("status").equals("active").first();
    if (active) return active;
    const previous = (
      await db.sessions.orderBy("started").reverse().toArray()
    ).filter((s) => s.status === "complete");
    const session: Session = {
      id: uid(),
      routineId: routine.id,
      name: routine.name,
      date,
      started: now,
      elapsed: 0,
      runningSince: now,
      status: "active",
      notes: "",
      entries: routine.items.map((item) => {
        const prior = previous
          .flatMap((s) => s.entries)
          .find((e) => e.exerciseId === item.exerciseId);
        return {
          exerciseId: item.exerciseId,
          min: item.min,
          max: item.max,
          notes: "",
          sets: Array.from({ length: item.sets }, (_, i) => ({
            kg: prior?.sets[i]?.kg ?? 0,
            reps: 0,
            rir: 2,
            done: false,
            technique: true,
          })),
        };
      }),
    };
    await db.sessions.add(session);
    return session;
  });
}
export const exercise = (id: string) => exercises.find((e) => e.id === id)!;
export function progression(
  entry: Entry,
  previous?: Entry,
  increment = exercise(entry.exerciseId).increment,
) {
  const sets = entry.sets;
  if (!sets.length || sets.some((s) => !s.done))
    return {
      message: "Completa todas las series para evaluar tu progreso.",
      suggested: null,
    };
  const base = Math.max(...sets.map((s) => s.kg));
  if (
    sets.every(
      (s) => s.reps >= entry.max && s.rir >= 1 && s.rir <= 3 && s.technique,
    ) &&
    sets.every((s) => s.kg === base)
  )
    return {
      message: "Puedes intentar aumentar el peso",
      suggested: Math.round((base + increment) * 100) / 100,
    };
  if (sets.every((s) => s.reps < entry.min))
    return {
      message: "Reduce ligeramente la carga y recupera el rango objetivo.",
      suggested: Math.max(0, base - increment),
    };
  if (sets.some((s) => s.reps < entry.min || !s.technique))
    return { message: "Mantén este peso y mejora la técnica", suggested: null };
  if (
    previous &&
    Math.max(...sets.map((s) => s.reps)) >
      Math.max(...previous.sets.filter((s) => s.done).map((s) => s.reps))
  )
    return { message: "Nuevo récord de repeticiones", suggested: null };
  if (previous && volume([entry]) > volume([previous]))
    return {
      message: "Has mejorado respecto a tu sesión anterior",
      suggested: null,
    };
  return {
    message: "Mantén este peso y suma repeticiones con control.",
    suggested: null,
  };
}
export const volume = (entries: Entry[]) =>
  entries.reduce(
    (sum, e) =>
      sum + e.sets.filter((s) => s.done).reduce((n, s) => n + s.kg * s.reps, 0),
    0,
  );
export type Backup = {
  version: 1;
  exportedAt: string;
  profile: Profile;
  routines: Routine[];
  sessions: Session[];
  weights: Weight[];
  meals: Meal[];
  schedule: Schedule[];
};
export async function backup(): Promise<Backup> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: (await db.settings.get("profile"))!.value,
    routines: await db.routines.toArray(),
    sessions: await db.sessions.toArray(),
    weights: await db.weights.toArray(),
    meals: await db.meals.toArray(),
    schedule: await db.schedule.toArray(),
  };
}
const num = (x: unknown, min = 0, max = 1e8) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
const str = (x: unknown) => typeof x === "string" && x.length <= 10000;
const validDate = (x: unknown) =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  !isNaN(Date.parse(x));
export function validateBackup(value: unknown): Backup {
  const b = value as Backup;
  const fail = () => {
    throw Error(
      "Copia inválida o incompatible. No se ha cambiado ningún dato.",
    );
  };
  if (!b || b.version !== 1 || !b.profile) fail();
  const p = b.profile;
  if (
    !str(p.name) ||
    !num(p.startKg, 20, 500) ||
    !num(p.goalKg, 20, 500) ||
    !num(p.height, 50, 260) ||
    !num(p.calories, 500, 10000) ||
    !num(p.protein, 0, 500) ||
    !["kg", "lb"].includes(p.unit) ||
    typeof p.tutorial !== "boolean" ||
    !p.increments ||
    typeof p.increments !== "object" ||
    Object.entries(p.increments).some(
      ([id, n]) => !exercises.some((e) => e.id === id) || !num(n, 0.1, 100),
    )
  )
    fail();
  for (const key of [
    "routines",
    "sessions",
    "weights",
    "meals",
    "schedule",
  ] as const) {
    if (!Array.isArray(b[key]) || b[key].length > 50000) fail();
    const ids = new Set<string>();
    for (const r of b[key]) {
      if (!str(r.id) || !r.id || ids.has(r.id)) fail();
      ids.add(r.id);
    }
  }
  for (const r of b.routines) {
    if (
      !str(r.name) ||
      !num(r.day, 0, 6) ||
      !Number.isInteger(r.day) ||
      !Array.isArray(r.items) ||
      r.items.length > 50
    )
      fail();
    for (const i of r.items)
      if (
        !exercises.some((e) => e.id === i.exerciseId) ||
        !num(i.sets, 1, 20) ||
        !Number.isInteger(i.sets) ||
        !num(i.min, 1, 100) ||
        !num(i.max, i.min, 100)
      )
        fail();
  }
  for (const s of b.sessions) {
    if (
      !str(s.name) ||
      !str(s.routineId) ||
      !validDate(s.date) ||
      !num(s.started) ||
      !num(s.elapsed) ||
      !(s.runningSince === null || num(s.runningSince)) ||
      !(s.ended === undefined || num(s.ended)) ||
      !(s.restEnd === undefined || num(s.restEnd)) ||
      !["active", "complete"].includes(s.status) ||
      !str(s.notes) ||
      !Array.isArray(s.entries) ||
      s.entries.length > 50
    )
      fail();
    for (const e of s.entries) {
      if (
        !exercises.some((x) => x.id === e.exerciseId) ||
        !num(e.min, 1, 100) ||
        !num(e.max, e.min, 100) ||
        !str(e.notes) ||
        !Array.isArray(e.sets) ||
        e.sets.length > 20
      )
        fail();
      for (const r of e.sets)
        if (
          !num(r.kg, 0, 1500) ||
          !num(r.reps, 0, 100) ||
          !Number.isInteger(r.reps) ||
          !num(r.rir, 0, 10) ||
          typeof r.done !== "boolean" ||
          typeof r.technique !== "boolean"
        )
          fail();
    }
  }
  if (b.sessions.filter((s) => s.status === "active").length > 1) fail();
  for (const w of b.weights)
    if (!validDate(w.date) || !num(w.kg, 20, 500)) fail();
  for (const m of b.meals)
    if (
      !validDate(m.date) ||
      !str(m.name) ||
      !num(m.kcal, 0, 10000) ||
      !num(m.protein, 0, 1000) ||
      !num(m.carbs, 0, 2000) ||
      !num(m.fat, 0, 1000) ||
      typeof m.favorite !== "boolean"
    )
      fail();
  for (const s of b.schedule)
    if (!validDate(s.date) || !b.routines.some((r) => r.id === s.routineId))
      fail();
  return b;
}
export async function restore(value: unknown) {
  const b = validateBackup(value);
  await db.transaction(
    "rw",
    [db.settings, db.routines, db.sessions, db.weights, db.meals, db.schedule],
    async () => {
      await Promise.all(
        [
          db.settings,
          db.routines,
          db.sessions,
          db.weights,
          db.meals,
          db.schedule,
        ].map((t) => t.clear()),
      );
      await db.settings.put({ id: "profile", value: b.profile });
      await db.routines.bulkPut(b.routines);
      await db.sessions.bulkPut(b.sessions);
      await db.weights.bulkPut(b.weights);
      await db.meals.bulkPut(b.meals);
      await db.schedule.bulkPut(b.schedule);
    },
  );
}
export function csv(sessions: Session[]) {
  const rows = [
    [
      "Fecha",
      "Sesión",
      "Ejercicio",
      "Serie",
      "Peso (kg)",
      "Repeticiones",
      "RIR",
      "Completada",
      "Notas",
    ],
  ];
  sessions.forEach((s) =>
    s.entries.forEach((e) =>
      e.sets.forEach((r, i) =>
        rows.push([
          s.date,
          s.name,
          exercise(e.exerciseId).name,
          String(i + 1),
          String(r.kg),
          String(r.reps),
          String(r.rir),
          r.done ? "Sí" : "No",
          e.notes,
        ]),
      ),
    ),
  );
  return (
    "\uFEFF" +
    rows
      .map((r) =>
        r
          .map(
            (v) =>
              '"' +
              (/^[=+@\-]/.test(v) ? "'" : "") +
              v.replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n")
  );
}
