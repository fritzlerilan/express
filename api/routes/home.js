import express from 'express'

export const HomeRouter = express.Router()

HomeRouter.get("/", (req, res) => {
    res.status = 200;
    res.setHeader("Content-Type", "text/plain");
    res.send("Peticion GET");
});

