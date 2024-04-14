import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { createCardSchema, createCustomerSchema, createPaymentSchema, createSubscriptionSchema, deleteCardSchema, errorToMessage, updateCardSchema } from "../lib/validations";
import { createCustomer, customerExists, recordPayment } from "../lib/dbActions";
import { PaymentsType } from "@prisma/client";
const stripe = new Stripe('sk_test_51P09FeL5ASj1GibM3uZZxryaCuFDYs98MTxnBTHCuvUg55jyMEhjrsjHGISN4313h3cy8A0GsPuRS7iF40YL0Oyv00gq5Rn4cX');

/**
 * Route to create a new customer in Stripe.
 * Expects fields for userId, name, email, description, phone, and address.
 * Checks if the customer already exists before creating.
 * Responds with a success message and the created customer object.
 */
export const addCustomer = async (req: Request, res: Response) => {

    const validatedFields = createCustomerSchema.safeParse(req.body);
    

    try {
        if (!validatedFields.success) {
            return res.status(400).json({ success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
        }

        const { userId, name, email, description, phone, address } = validatedFields.data;
        const customerData = { name, email, description, phone, address };

        if(await customerExists(userId)) {
            return res.status(400).json({ success: false, message: "Customer already exists" });
        }
                
        const customer = await stripe.customers.create(customerData);

        await createCustomer(userId, customer.id);

        res.json({ success: true, message: 'Customer created successfully!', customer });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error creating customer', error: error.message });
    }
};

/**
 * Route to add a new card to a customer in Stripe.
 * Expects fields for customer_id and token.
 * Responds with a success message and the customer source object.
 */
export const addCard = async (req: Request, res: Response) => {

    const validatedFields = createCardSchema.safeParse(req.body);

    if (!validatedFields.success) {
        return res.status(400).json({success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
    }

    const { customer_id, token } = validatedFields.data;


    try {

        const customerSource = await stripe.customers.createSource(customer_id, { source: token });

        res.json({success: true, message: 'Card added successfully!', customerSource });
    } catch (error: any) {
        res.status(500).json({success: false, message: 'Error adding card', error: error });
    }
};

/**
 * Route to list all cards for a specific customer in Stripe.
 * Expects a customerId parameter in the route.
 * Responds with a success message and an array of card objects.
 */
export const getCardList = async (req: Request, res: Response) => {
    try {
        const customerId = req.params.customerId;
        if (!customerId) {
            return res.status(400).json({ message: 'Customer ID is required' });
        }

        const sources = await stripe.customers.listSources(
            customerId,
            { object: 'card', limit: 100 } 
        );

        const cards = sources.data;
        if (cards.length > 0) {
            res.json({success: true, message: 'All card list fetched', cards });
        } else {
            res.status(404).json({success: false, message: 'No cards found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error listing cards', error: error.message });
    }
};

/**
 * Route to retrieve a specific card for a customer in Stripe.
 * Expects fields for cardId and customerId.
 * Responds with a success message and the retrieved card object.
 */
export const getCard = async (req: Request, res: Response) => {

    const validatedFields = deleteCardSchema.safeParse(req.body);
    if(!validatedFields.success) {
        return res.status(400).json({ success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
    }

    const { cardId, customerId } = validatedFields.data;

    try{

        const card = await stripe.customers.retrieveSource(
            customerId,
            cardId
        );
        res.json({ success: true, message: 'Card fetched successfully', card });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error getting card', error: error.message });
    }
};

/**
 * Route to delete a specific card for a customer in Stripe.
 * Expects fields for cardId and customerId.
 * Responds with a success message and the deleted card object.
 */
export const deleteCard = async (req: Request, res: Response) => {

    const validatedFields = deleteCardSchema.safeParse(req.body);
    if(!validatedFields.success) {
        return res.status(400).json({ success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
    }

    const { cardId, customerId } = validatedFields.data;

    try{

        const sources = await stripe.customers.listSources(
            customerId,
            { object: 'card', limit: 100 } 
        );
        
        sources.data.length === 1 && res.status(400).json({ success: false, message: 'Cannot delete last card' });

       const deletedCard = await stripe.customers.deleteSource(
            customerId,
            cardId
        );
        res.json({ success: true, message: 'Card deleted successfully', deletedCard });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error deleting card', error: error.message });
    }
};

/**
 * Route to process a custom payment in Stripe.
 * Expects fields for amount, currency, source, description, userId, and paymentType.
 * Creates a charge for the payment and records the payment details.
 * Responds with a success message and the charge object.
 */
export const customPayment = async (req: Request, res: Response) =>  {

    const validatedFields = createPaymentSchema.safeParse(req.body);

    if (!validatedFields.success) {
        return res.status(400).json({ success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
    }

    const { amount, currency, source, description, userId, paymentType } = validatedFields.data;

    try {
        
        const charge = await stripe.charges.create({
            amount,
            currency,
            source,
            description,
        });

        if(charge.status !== 'succeeded') {
            res.status(400).json({ succes: false ,message: 'Payment failed' });
        }
        
        await recordPayment({
            userId,
            customerId: charge.source?.id as string,
            amount,
            paymentType: paymentType as PaymentsType,
            paymentMethod: charge.payment_method as string,
            status: charge.status
        })

        res.json({ success: true, message: 'Payment successful', charge });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error processing payment', error: error.message });
    }
};

export const setDefaultCard = async (req: Request, res: Response) =>  {
    try {
        const { customerId, cardId } = req.params;
        if (!customerId || !cardId) {
            return res.status(400).json({ success: false, message: 'Customer ID and Card ID are required' });
        }

        const updatedCustomer = await stripe.customers.update(customerId, {
            default_source: cardId,
        });

        res.json({ success: true, message: 'Default card set successfully', updatedCustomer });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error setting default card', error: error.message });
    }
}

export const getDefaultCard = async (req: Request, res: Response) =>  {
    try {
        const customerId = req.params.customerId;
        if (!customerId) {
            return res.status(400).json({ success: false, message: 'Customer ID is required' });
        }

        const customer = await stripe.customers.retrieve(
            customerId
        );

        const card = await stripe.customers.retrieveSource(
            customerId,
            (customer as any).default_source
        );

        res.json({ success: true, message: 'Default card fetched successfully', cardId: customer.deleted ? null : (customer as any).default_source, card });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error getting default card', error: error.message });
    }
}


export const createSubscription = async (req: Request, res: Response) => {

    const validatedFields = createSubscriptionSchema.safeParse(req.body);
    if (!validatedFields.success) {
        return res.status(400).json({ success: false, error: "Validation error", message: errorToMessage(validatedFields.error) });
    }

    const { customerId, priceId, token } = validatedFields.data;

    try {

        const subscription = await stripe.subscriptions.create({

            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: "default_incomplete",
            expand: ['latest_invoice.payment_intent']
        })

        const customer = await stripe.customers.retrieve(customerId);
        
        res.json({
            success: true, message: 'Subscription created successfully', subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice,
            methodId: customer
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error processing payment', error: error.message });
    }
}
