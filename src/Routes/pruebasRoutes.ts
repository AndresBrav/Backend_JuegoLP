import express, { Request, Response, Router } from 'express';
import Juego from '../Models/juegoModel';
import UsuarioJuegos from '../Models/usuario_juegosModel';
import Usuarios from '../Models/usuarioModel';
const router:Router = express.Router()

router.get('/juegos',async(req:Request,res:Response) => {
    
const juegos = await Juego.findAll()
    res.json({
        msg:"accedido",
        juegos:juegos
    })
})

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