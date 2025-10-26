import { clientController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { clientValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Get clients by relationship manager
router
    .route('/:rmId/clients')
    .get(auth('getClients'), validate(clientValidation.getClientsByRM), clientController.getClientsByRM);

export default router;

/**
 * @swagger
 * tags:
 *   name: Relationship Managers
 *   description: Relationship manager related operations
 */

/**
 * @swagger
 * /relationship-managers/{rmId}/clients:
 *   get:
 *     summary: Get clients by relationship manager
 *     description: Get all clients assigned to a relationship manager
 *     tags: [Relationship Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rmId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Relationship Manager ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
