import { Router } from "express";
import { createConnectAccount, createExpressAccount, login } from "../controllers/accounts";


const connectStripe: Router = Router();

connectStripe.post('/create-conntect-account', createConnectAccount);

connectStripe.post('/create-external-account', createExpressAccount);

connectStripe.post('/login', login);

export default connectStripe;