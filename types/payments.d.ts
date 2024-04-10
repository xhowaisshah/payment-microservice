import { PaymentsType } from "@prisma/client";

type PaymentDetails = {
  userId: string;
  customerId: string;
  amount: number;
  paymentType: PaymentsType;
  paymentMethod: string;
  status: string;
};

export { PaymentDetails }