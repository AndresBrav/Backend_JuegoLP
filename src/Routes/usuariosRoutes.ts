import express, { Request, Response, Router } from 'express';
import  usuariosController from '../Controllers/usuariosController'

const router: Router = express.Router();

router.get('/', usuariosController.consultar);

router.post('/', usuariosController.ingresar);

router.route("/:id")
    .get(usuariosController.consultarDetalle)
    .put(usuariosController.actualizar)
    .delete(usuariosController.borrar);

export default router;
