import express, { Request, Response, Router } from 'express';
import { consultar, consultarDetalle, ingresar, actualizar, borrar } from '../Controllers/usuariosController'; // Asegúrate de importar las funciones from '../Controllers/usuariosController'

const router: Router = express.Router();

router.get('/',consultar);

router.post('/',ingresar);

router.route("/:id")
    .get(consultarDetalle)
    .put(actualizar)
    .delete(borrar);

export default router;