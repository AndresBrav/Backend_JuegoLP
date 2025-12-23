import * as dotenv from 'dotenv';
dotenv.config(); // ¡Esto carga el archivo .env!
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import UsuariosRoutes from '../Routes/usuariosRoutes';
import PruebasRoutes from '../Routes/pruebasRoutes';
import JuegosRoutes from '../Routes/juegosRoutes'
import avataresRoutes from '../Routes/avataresRoutes';

import morgan from 'morgan';
// actualizado

import db from '../db/conexion'



class ApiServer {
  private usuariosPath: string;
  private app: Application;
  private pruebasPath:string;
  private juegosPath:string;
  private avataresPath:string;
  

  constructor() {
    this.app = express();
    this.usuariosPath = "/usuarios";
    this.pruebasPath = "/pruebas";
    this.juegosPath = "/juegos";
    this.avataresPath = "/avatares";
    this.middlewares();  // Llama a la función middleware
    this.routes();       // Registra las rutas
    this.dbConnet(); //conexion a la base de datos
    
  }

  private middlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(morgan('dev'))
    // this.app.use(express.static('public'));
  }

  public routes(): void {
    this.app.use(this.usuariosPath, UsuariosRoutes);
    this.app.use(this.pruebasPath, PruebasRoutes);
    this.app.use(this.juegosPath,JuegosRoutes)
    this.app.use(this.avataresPath,avataresRoutes)
  }

  public escuchar(): void {
    const port = process.env.PORT || 4000;
    this.app.listen(port, () => {
      console.log(`API REST iniciada en el puerto ${port}`);
    });
  }

  async dbConnet() {
    //conexion a la base de datos

    try {
      await db.authenticate();
      console.log("base de datos conectada");
    } catch (error) {
      console.log(error);
      console.log('error al conectarse en la base de datos');
    }
  }
}

export default ApiServer;