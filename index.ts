import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import paymentRouter from './routes/payments';
import connectStripe from './routes/stripeConnect';

dotenv.config();

const app: express.Application = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());


app.use('/payments', paymentRouter);
app.use('/accounts', connectStripe);

app.listen(port, () => {
  console.log(`Server is up and running at http://localhost:${port}`);
});