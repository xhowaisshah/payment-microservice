import { Router } from "express";
import { createSubscription, getDefaultCard, setDefaultCard } from "../controllers/payment";
const { addCustomer, addCard, getCardList, getCard, deleteCard, customPayment } = require("../controllers/payment");


const paymentRouter: Router = Router();

paymentRouter.post('/create-customer', addCustomer);

paymentRouter.post('/add-card', addCard);

paymentRouter.get('/list-card/:customerId', getCardList);

paymentRouter.post('/get-card', getCard);

paymentRouter.put('/set-default-card/:customerId/:cardId', setDefaultCard);

paymentRouter.get('/get-default-card/:customerId', getDefaultCard);

paymentRouter.post('/delete-card', deleteCard);

paymentRouter.post('/custom-payment', customPayment);

paymentRouter.post('/create-subscription', createSubscription);

export default paymentRouter;