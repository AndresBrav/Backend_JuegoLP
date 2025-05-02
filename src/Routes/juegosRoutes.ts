import express from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; 
import { consultarJuegos } from "../Controllers/juegosController";
const router = express.Router()
router.get('/consultar', verifyToken, consultarJuegos);

/* router.post('/ingresar', verifyToken, ingresarJuegos);

router.route("/detalles/:id")
    .get(verifyToken, consultarDetalle)  // Aplica verifyToken al método GET
    .put(verifyToken, actualizar)        // Aplica verifyToken al método PUT
    .delete(verifyToken, borrar); */


export default router 