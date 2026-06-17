const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use(middlewares);

server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
    if (req.method === "POST") {
        req.body.createdAt = Date.now();
    }
    next();
});

// S1: custom endpoint that owns the "done" state transition for a todo item.
// Marking done stamps `finishedAt` with the current time; un-completing clears
// it back to null. Centralizing both directions here keeps the
// "`finishedAt` is set iff `isDone`" invariant on the server, instead of
// trusting the client to clear the timestamp via a generic PATCH.
// `isDone` defaults to `true` when omitted, preserving the original
// "mark as done" call shape.
server.patch("/items/:id/done", (req, res) => {
    const id = Number(req.params.id);
    const item = router.db.get("items").find({ id }).value();

    if (!item) {
        return res.status(404).jsonp({ error: "Item not found" });
    }

    const isDone = req.body?.isDone ?? true;
    const updated = router.db
        .get("items")
        .find({ id })
        .assign({ isDone, finishedAt: isDone ? Date.now() : null })
        .write();

    res.jsonp(updated);
});

// Use default router
server.use(router);
server.listen(3000, () => {
    console.log("JSON Server is running");
});
