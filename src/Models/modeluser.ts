import { DataTypes, Model, Sequelize } from 'sequelize';
import db from '../db/conexion'; // Asegúrate de que esta ruta sea correcta
import Carro from './modelcarro';

// Define una interfaz para los atributos del modelo
interface UsuariosAttributes {
  username?: string;
  edad?: number;
  password?: string;
}

// Define una interfaz para la instancia del modelo
export interface UsuariosInstance
  extends Model<UsuariosAttributes>, // incluye métodos como .save(), .destroy(), etc. // Métodos de Sequelize con tipos
    UsuariosAttributes {}           // permite acceder directamente a username, edad, password

// Define el modelo con los tipos específicos
const User = db.define<UsuariosInstance>('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.hasMany(Carro, {
  foreignKey: 'user_id',
  sourceKey: 'id'
});

Carro.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'id'
});

export default User;
