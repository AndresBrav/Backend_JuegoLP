import express, { Request, Response, Router } from 'express';
import Avatares from "../Models/avatarModel";

const router = express.Router()

router.get('/getAvatares', async (req:Request, res:Response) => {

    const avatares =  await Avatares.findAll();
    res.json(avatares)

});

export default router;