// Imports
import express from "express";
import http from "http";
import { HomeRouter } from "./routes/home.js";
import { MPRouter } from "./routes/mercadopago.js";

// Inicialización
const app = express();
const port = 5000;
app.use(express.json());

// Routes
app.use(HomeRouter);
app.use("/mp", MPRouter);

app.listen(port, () => {
    console.log(`Server listen on port ${port}`);
});
