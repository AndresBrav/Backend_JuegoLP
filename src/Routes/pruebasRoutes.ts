import express, { Request, Response, Router } from 'express';
import Juego from '../Models/juegoModel';
import UsuarioJuegos from '../Models/usuario_juegosModel';
import Usuarios from '../Models/usuarioModel';
const router:Router = express.Router()

/**
 * @swagger
 * /pruebas/juegos:
 *   get:
 *     tags: [Pruebas]
 *     summary: Listar todos los juegos (endpoint de pruebas)
 *     responses:
 *       200:
 *         description: Lista de juegos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: accedido
 *                 juegos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Juego'
 */
router.get('/juegos',async(req:Request,res:Response) => {
    
const juegos = await Juego.findAll()
    res.json({
        msg:"accedido",
        juegos:juegos
    })
})

/**
 * @swagger
 * /pruebas/usuarioJuegos:
 *   get:
 *     tags: [Pruebas]
 *     summary: Listar juegos con sus registros usuario_juego (endpoint de pruebas)
 *     responses:
 *       200:
 *         description: Juegos con registros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: accedido
 *                 juegos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Juego'
 */
router.get('/usuarioJuegos',async(req:Request,res:Response) => {
    
const juegos = await Juego.findAll({
    include:[
        {
            model:UsuarioJuegos
        }
    ]
})
    res.json({
        msg:"accedido",
        juegos:juegos
    })
})

/**
 * @swagger
 * /pruebas/usuarioJuegos2:
 *   get:
 *     tags: [Pruebas]
 *     summary: Listar usuarios con sus registros usuario_juego (endpoint de pruebas)
 *     responses:
 *       200:
 *         description: Usuarios con registros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: accedido
 *                 usuarios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 */
router.get('/usuarioJuegos2',async(req:Request,res:Response) => {
    
const usuarios = await Usuarios.findAll({
    include:[
        {
            model:UsuarioJuegos
        }
    ]
})
    res.json({
        msg:"accedido",
        usuarios:usuarios
    })
})

export default router;