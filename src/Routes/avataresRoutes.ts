import express, { Request, Response, Router } from 'express';
import { obtenerAvataresController, obtenerUno } from '../Controllers/avatarController';

const router = express.Router()

router.get('/getAvatares', obtenerAvataresController);

router.get('/getOneAvatar/:id',obtenerUno)

export default router;