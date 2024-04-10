import { PaymentsType } from "@prisma/client";
import prisma from "./db";
import { PaymentDetails } from "../types/payments";

const customerExists = async (userId: string): Promise<boolean> => {
    const customer = await prisma.users.findFirst({
        where: {
            id: userId,
            customerId: {
                not: null
            }
        },
        select: {
            customerId: true 
        }
    });

    return Boolean(customer); 
}

const createCustomer = async (userId: string, customerId: string): Promise<any> => {
    const customer = await prisma.users.update({
       where: {
           id: userId
       },
       data: {
           customerId:  customerId
       }
    });

    return customer;
}

const recordPayment = async (payload: PaymentDetails): Promise<any> => {
    const payment = await prisma.payments.create({
        data: {
            userId: payload.userId,
            customerId: payload.customerId,
            amount: payload.amount,
            payments_type: payload.paymentType,
            paymentMethod: payload.paymentMethod,
            status: payload.status,
            paymentDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    });

    return payment;
}



export { customerExists, createCustomer, recordPayment };

