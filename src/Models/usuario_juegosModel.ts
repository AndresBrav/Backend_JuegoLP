import { DataTypes, Model, Sequelize } from 'sequelize';
import db from '../db/conexion'; // Asegúrate de que esta ruta sea correcta

// permite acceder directamente a username, edad, password

// Define el modelo con los tipos específicos
const UsuarioJuegos = db.define('UsuarioJuegos', {
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    juego_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
});

export default UsuarioJuegos;