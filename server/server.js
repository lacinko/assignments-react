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

// S1: custom endpoint that marks a single todo item as "done".
// Sets `isDone` to true and stamps `finishedAt` with the current time.
server.patch("/items/:id/done", (req, res) => {
    const id = Number(req.params.id);
    const item = router.db.get("items").find({ id }).value();

    if (!item) {
        return res.status(404).jsonp({ error: "Item not found" });
    }

    const updated = router.db
        .get("items")
        .find({ id })
        .assign({ isDone: true, finishedAt: Date.now() })
        .write();

    res.jsonp(updated);
});

// Use default router
server.use(router);
server.listen(3000, () => {
    console.log("JSON Server is running");
});
