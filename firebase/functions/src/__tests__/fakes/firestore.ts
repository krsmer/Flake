type DocData = Record<string, any>;

export function createFakeFirestore() {
  const bookings = new Map<string, DocData>();
  const slots = new Map<string, DocData>();

  let idCounter = 1;

  function makeDocRef(collection: Map<string, DocData>, id?: string) {
    const docId = id ?? `doc_${idCounter++}`;
    return {
      id: docId,
      async get() {
        return { exists: collection.has(docId), data: () => collection.get(docId) };
      },
      async update(patch: DocData) {
        const current = collection.get(docId);
        if (!current) throw new Error("Doc not found");
        collection.set(docId, { ...current, ...patch });
      },
      async set(data: DocData) {
        collection.set(docId, data);
      },
      ref: { id: docId }
    };
  }

  function makeQuery(collection: Map<string, DocData>) {
    const filters: Array<[string, string, any]> = [];
    let order: { field: string; dir: "asc" | "desc" } | null = null;
    let limitCount: number | null = null;

    return {
      where(field: string, op: string, value: any) {
        filters.push([field, op, value]);
        return this;
      },
      orderBy(field: string, dir: "asc" | "desc" = "asc") {
        order = { field, dir };
        return this;
      },
      limit(count: number) {
        limitCount = count;
        return this;
      },
      async get() {
        let rows = Array.from(collection.entries()).map(([id, data]) => ({
          id,
          data,
          ref: makeDocRef(collection, id)
        }));

        for (const [field, op, value] of filters) {
          rows = rows.filter((row) => {
            const fieldValue = row.data[field];
            if (op === "==") return fieldValue === value;
            if (op === "<=") return fieldValue <= value;
            return false;
          });
        }

        const currentOrder = order;
        if (currentOrder) {
          rows.sort((a, b) => {
            const av = a.data[currentOrder.field];
            const bv = b.data[currentOrder.field];
            if (av === bv) return 0;
            const res = av > bv ? 1 : -1;
            return currentOrder.dir === "asc" ? res : -res;
          });
        }

        if (typeof limitCount === "number") {
          rows = rows.slice(0, limitCount);
        }

        return {
          empty: rows.length === 0,
          size: rows.length,
          docs: rows.map((row) => ({
            id: row.id,
            data: () => row.data,
            ref: row.ref
          }))
        };
      }
    };
  }

  const collections = {
    bookings: () => ({
      doc: (id?: string) => makeDocRef(bookings, id),
      async add(data: DocData) {
        const ref = makeDocRef(bookings);
        await ref.set(data);
        return { id: ref.id };
      },
      where(field: string, op: string, value: any) {
        return makeQuery(bookings).where(field, op, value);
      }
    }),
    slots: () => ({
      doc: (id?: string) => makeDocRef(slots, id),
      async add(data: DocData) {
        const ref = makeDocRef(slots);
        await ref.set(data);
        return { id: ref.id };
      }
    }),
    providers: () => ({
      doc: (id?: string) => makeDocRef(new Map<string, DocData>(), id)
    }),
    services: () => ({
      doc: (id?: string) => makeDocRef(new Map<string, DocData>(), id)
    })
  };

  const db = {
    batch() {
      const ops: Array<() => void> = [];
      return {
        set(ref: any, data: DocData) {
          ops.push(() => {
            if (ref?.set) ref.set(data);
          });
        },
        update(ref: any, data: DocData) {
          ops.push(() => {
            if (ref?.update) ref.update(data);
          });
        },
        async commit() {
          for (const op of ops) op();
        }
      };
    }
  };

  return {
    collections,
    db,
    stores: { bookings, slots },
    reset() {
      bookings.clear();
      slots.clear();
      idCounter = 1;
    }
  };
}
