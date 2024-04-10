import { PaymentsType } from '@prisma/client';
import * as z from 'zod';

const createCustomerSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    description: z.string().optional(),
    phone: z.string().optional(),
    address: z.object({
        line1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postal_code: z.string().optional(), 
        country: z.string().optional(),
    }).optional(),
}).strict();

const createCardSchema = z.object({
    customer_id: z.string().min(1, 'Customer ID is required'),
   token: z.any(),
}).strict();

const createPaymentSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    paymentType: z.nativeEnum(PaymentsType),
    amount: z.number().min(1, 'Amount is required'),
    currency: z.string().min(1, 'Currency is required'),
    source: z.any(),
    description: z.string().min(1, 'Description is required'),
}).strict();

const deleteCardSchema = z.object({
    cardId: z.string().min(1, 'Card ID is required'),
    customerId: z.string().min(1, 'Customer ID is required'),
})

const updateCardSchema = z.object({
    customer_id: z.string().min(1, 'Card ID is required'),
    card_id: z.string().min(1, 'Card ID is required'),
    token: z.any(),
})

const createConnectAccountSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    bussinessName: z.string().min(1, 'Business name is required'),
    street: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    contactNumber: z.string().min(11, 'Contact number is required'),
})

const errorToMessage = (error: z.ZodError) => {
    const issues = error.errors.map((e) => ({
      path: e.path.length > 0 ? e.path.join(".") : "root",
      message: e.message,
    }));
    return {
        issues,
        name: error.name
    };
};

export { createCustomerSchema, createCardSchema, createPaymentSchema, deleteCardSchema, updateCardSchema, createConnectAccountSchema, errorToMessage };

