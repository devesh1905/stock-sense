import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import warehousesRouter from './warehouses.js';
import locationsRouter from './locations.js';
import categoriesRouter from './categories.js';
import productsRouter from './products.js';
import stockRouter from './stock.js';
import operationsRouter from './operations.js';

const router = Router();

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/warehouses', warehousesRouter);
router.use('/locations', locationsRouter);
router.use('/categories', categoriesRouter);
router.use('/products', productsRouter);
router.use('/stock', stockRouter);
router.use('/operations', operationsRouter);

export default router;
