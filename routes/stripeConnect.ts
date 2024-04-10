import { Router } from "express";
import { createConnectAccount, createExpressAccount } from "../controllers/accounts";


const connectStripe: Router = Router();

connectStripe.post('/create-conntect-account', createConnectAccount);

connectStripe.post('/create-external-account', createExpressAccount);

export default connectStripe;