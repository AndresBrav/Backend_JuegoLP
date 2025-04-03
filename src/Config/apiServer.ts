import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import UsuariosRoutes from '../Routes/usuariosRoutes';
import morgan from 'morgan';
class ApiServer {
  private usuariosPath: string;
  private app: Application;

  constructor() {
    this.app = express();
    this.usuariosPath = "/usuarios";
    this.middlewares();  // Llama a la función middleware
    this.routes();       // Registra las rutas
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
}

export default ApiServer;
