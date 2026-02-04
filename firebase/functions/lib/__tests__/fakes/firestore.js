export function createFakeFirestore() {
    const bookings = new Map();
    const slots = new Map();
    let idCounter = 1;
    function makeDocRef(collection, id) {
        const docId = id ?? `doc_${idCounter++}`;
        return {
            id: docId,
            async get() {
                return { exists: collection.has(docId), data: () => collection.get(docId) };
            },
            async update(patch) {
                const current = collection.get(docId);
                if (!current)
                    throw new Error("Doc not found");
                collection.set(docId, { ...current, ...patch });
            },
            async set(data) {
                collection.set(docId, data);
            },
            ref: { id: docId }
        };
    }
    function makeQuery(collection) {
        const filters = [];
        let order = null;
        let limitCount = null;
        return {
            where(field, op, value) {
                filters.push([field, op, value]);
                return this;
            },
            orderBy(field, dir = "asc") {
                order = { field, dir };
                return this;
            },
            limit(count) {
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
                        if (op === "==")
                            return fieldValue === value;
                        if (op === "<=")
                            return fieldValue <= value;
                        return false;
                    });
                }
                const currentOrder = order;
                if (currentOrder) {
                    rows.sort((a, b) => {
                        const av = a.data[currentOrder.field];
                        const bv = b.data[currentOrder.field];
                        if (av === bv)
                            return 0;
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
            doc: (id) => makeDocRef(bookings, id),
            async add(data) {
                const ref = makeDocRef(bookings);
                await ref.set(data);
                return { id: ref.id };
            },
            where(field, op, value) {
                return makeQuery(bookings).where(field, op, value);
            }
        }),
        slots: () => ({
            doc: (id) => makeDocRef(slots, id),
            async add(data) {
                const ref = makeDocRef(slots);
                await ref.set(data);
                return { id: ref.id };
            }
        }),
        providers: () => ({
            doc: (id) => makeDocRef(new Map(), id)
        }),
        services: () => ({
            doc: (id) => makeDocRef(new Map(), id)
        })
    };
    const db = {
        batch() {
            const ops = [];
            return {
                set(ref, data) {
                    ops.push(() => {
                        if (ref?.set)
                            ref.set(data);
                    });
                },
                update(ref, data) {
                    ops.push(() => {
                        if (ref?.update)
                            ref.update(data);
                    });
                },
                async commit() {
                    for (const op of ops)
                        op();
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
