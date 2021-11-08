import express from "express";
import axios from "axios";
// Middleware
import { checkSubscription } from "../controllers/mercadopago.js";

import {
    obtainInitPointUrl,
    receiveNotification,
    paymentInfo,
} from "../controllers/mercadopago.js";

axios.defaults.headers.common["Authorization"] =
    "Bearer " + process.env["ACCESS_TOKEN"];

export const MPRouter = express.Router();

MPRouter.post("/checkout", [checkSubscription], obtainInitPointUrl);
MPRouter.post("/notification", receiveNotification);
MPRouter.get("/ticket/:id", paymentInfo);
