import axios from "axios";
import mercadopago from "mercadopago";

const {
    ACCESS_TOKEN,
    NO_PENDING_PAYMENTS,
    CARD_PAYMENT_DESCRIPTION,
    HOOK_BIN_URI,
} = process.env;

mercadopago.configure({
    access_token: ACCESS_TOKEN,
});

export const checkPastPayments = async (username) => {
    const url = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=${username}`;
    const response = await axios.get(url).catch(function (error) {
        console.log(error);
        return;
    });
    const payments = response.data.results;
    return payments;
};

export const paymentsController = async (req, res) => {
    const { username } = req.params;
    const payments = await checkPastPayments(username);
    const formatedPayments = payments.map((payment) => {
        const { id, status, date_approved, status_detail } = payment;
        return {
            id,
            status,
            date_approved,
            status_detail,
        };
    });
    res.json({ payments: formatedPayments });
};

export const checkSubscription = async (req, res, next) => {
    const { username } = req.params;

    const payments = await checkPastPayments(username);

    if (payments.length > 0) {
        const lastPayment = payments[0];
        const { date_approved, id } = lastPayment;
        const created = new Date(date_approved);
        res.json({
            id,
            created,
        });
        return;
    } else {
        next();
    }
};

export const obtainInitPointUrl = async (req, res) => {
    const { username } = req.body;
    const preference = {
        //Este valor podria ser util para dejar asentado el username del pagador ya que queda registrado en la api de mercadopago.
        external_reference: username,
        notification_url: HOOK_BIN_URI || "",
        // El pago solo puede resultar aprobado o rechazado.
        binary_mode: Boolean(NO_PENDING_PAYMENTS) || true,
        // El valor del atributo aparecerá en el resumen de la tarjeta de tu comprador
        statement_descriptor: CARD_PAYMENT_DESCRIPTION,

        items: [
            {
                title: "Subscripción 30 días.",
                quantity: 1,
                currency_id: "ARS",
                unit_price: 1000,
            },
        ],
    };
    const responsePreference = await mercadopago.preferences.create(preference);
    const { init_point } = responsePreference.body;
    res.json({
        init_point,
    });
};

export const receiveNotification = async (req, res) => {
    const params = req.params;
    console.log("Payed Successfully");
    res.json({ params });
};

export const paymentInfo = async (req, res) => {
    const { id } = req.params;
    try {
        const uri = `https://api.mercadopago.com/v1/payments/${id}`;
        const response = await axios.get(uri).data;
        const { external_reference, status, date_approved } = response;
        res.json({ external_reference, status, date_approved });
    } catch (error) {
        console.log(error.message);
    }
};
