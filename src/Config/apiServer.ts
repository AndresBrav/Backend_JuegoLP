import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import UsuariosRoutes from '../Routes/usuariosRoutes';
import morgan from 'morgan';

import db from '../db/conexion'
class ApiServer {
  private usuariosPath: string;
  private app: Application;

  constructor() {
    this.app = express();
    this.usuariosPath = "/usuarios";
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
  }

  public escuchar(): void {
    this.app.listen(3000, () => {
      console.log('API REST iniciada en el puerto 3000');
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
