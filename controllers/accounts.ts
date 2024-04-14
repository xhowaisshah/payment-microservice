import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { createConnectAccountSchema, errorToMessage } from "../lib/validations";

const stripe = new Stripe('sk_test_51P09FeL5ASj1GibM3uZZxryaCuFDYs98MTxnBTHCuvUg55jyMEhjrsjHGISN4313h3cy8A0GsPuRS7iF40YL0Oyv00gq5Rn4cX');
const accountsRouter: Router = Router();

export const createConnectAccount = async (req: Request, res: Response) => {
    const validatedFields = createConnectAccountSchema.safeParse(req.body);
    try {
        if (!validatedFields.success) {
            return res.status(400).json({ success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
        }

        const { email, password, bussinessName, street, state, country, contactNumber } = validatedFields.data;
        const account = await stripe.accounts.create({
            type: 'express',
            email,
            country,
            business_type: 'individual',
            business_profile: {
                name: bussinessName,
                support_address: {
                    city: '',
                    line1: street,
                    postal_code: '',
                    state,
                    country,
                },
                support_phone: contactNumber,
            },
            capabilities: {
                transfers: { requested: true },
                card_payments: { requested: true },
            }
        });


        const link = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.REACT_APP_URL}/settings`,
            return_url: `${process.env.REACT_APP_URL}/settings`,
            type: 'account_onboarding',
        });


        return res.json({ success: true, account, link, message: 'Account created successfully!' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export const createExpressAccount = async (req: Request, res: Response) => {
    const validatedFields = createConnectAccountSchema.safeParse(req.body);
    try {
        if (!validatedFields.success) {
            return res.status(400).json({ success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
        }

        const { email, country } = validatedFields.data;


        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({ success: false, error: "Refresh token is required" });
        }

        const accessTokenResponse = await stripe.oauth.token({
            grant_type: 'refresh_token',
            refresh_token,
        });

        const account = await stripe.accounts.create({
            type: 'standard',
            country,
            email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            external_account: accessTokenResponse.access_token,
        });

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: 'http://yourwebsite.com/reauth',
            return_url: 'http://yourwebsite.com/return',
            type: 'account_onboarding',
        });

        return res.json({ success: true, accountLink });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

export const login = async (req: Request, res: Response) => {
    accountsRouter.post('/login', async (req: Request, res: Response) => {
        try{
    
            const login = await stripe.accounts.createLoginLink('acct_1P4NTUQ2VhlRjFsT')
            res.json({ success: true, login });
        } catch(error: any) {
            return res.status(500).json({ success: false, error: error.message }); 
        }
    })
}

export default accountsRouter;