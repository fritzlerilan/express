import axios from "axios";
import mercadopago from "mercadopago";

const {
    ACCESS_TOKEN,
    NO_PENDING_PAYMENTS,
    CARD_PAYMENT_DESCRIPTION,
    NOTIFICATION_URL,
} = process.env;

mercadopago.configure({
    access_token: ACCESS_TOKEN,
});

export const checkPastPayments = async (username) => {
    const url = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=${username}`;
    const response = await axios.get(url).catch(function (error) {
        console.log(error);
        return [];
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
    res.json({ payments: formatedPayments, statusCode: 200 });
};

export const checkSubscription = async (req, res, next) => {
    const { username } = req.params;

    if (!username) {
        res.sendStatus(400);
        return;
    }
    const payments = await checkPastPayments(username);

    if (payments.length > 0) {
        const lastPayment = payments[0];
        const { date_approved, id } = lastPayment;
        const created = new Date(date_approved).getTime();
        const actualDay = new Date().getTime();
        const diff = (actualDay - created) / (1000 * 60 * 60 * 24);
        const remainingDays = 30 - diff;

        if (remainingDays > 0) {
            res.status(200).json({
                result: {
                    id,
                    created,
                    remainingDays
                },
                statusCode: 200,
            });
            return;
        }
    }
    next();
};

export const obtainInitPointUrl = async (req, res) => {
    const { username } = req.params;

    const preference = {
        //Este valor podria ser util para dejar asentado el username del pagador ya que queda registrado en la api de mercadopago.
        external_reference: username,
        notification_url: NOTIFICATION_URL + `/${username}`,
        // El pago solo puede resultar aprobado o rechazado.
        binary_mode: Boolean(NO_PENDING_PAYMENTS) || true,
        // El valor del atributo aparecer?? en el resumen de la tarjeta de tu comprador
        statement_descriptor: CARD_PAYMENT_DESCRIPTION,

        items: [
            {
                title: "Subscripci??n 30 d??as.",
                quantity: 1,
                currency_id: "ARS",
                unit_price: 1000,
            },
        ],
    };
    const responsePreference = await mercadopago.preferences.create(preference);
    const { init_point } = responsePreference.body;
    res.status(201).json({ result: { init_point }, statusCode: 201 });
};

export const receiveNotification = async (req, res) => {
    const { username } = req.params;
    const data = req.body;

    if (data.hasOwnProperty("topic")) {
        console.log("Payment created successfully.");
        res.status(200).send("");
        return;
    }

    const {
        type,
        data: { id },
        date_created,
    } = data;
    // Para propocitos de debugueo
    console.log({
        id,
        type,
        date_created,
        username,
        message: "Payed successfully.",
    });

    // Aqui se necesita ejecutar el trigger para activar la cuenta a la db de firebase con el dato de username

    res.status(200).send("");
};

export const paymentInfo = async (req, res) => {
    const { id } = req.params;
    try {
        const uri = `https://api.mercadopago.com/v1/payments/${id}`;
        const response = await axios.get(uri);
        const data = await response.data;
        const { external_reference, status, date_approved } = data;
        res.status(200).json({ external_reference, status, date_approved });
    } catch (error) {
        console.log(`Consulta de pago: ${id}. Error: ${error.message}`);
        res.status(400).json({
            message: "Bad Request",
            statusCode: 400,
        });
    }
};
