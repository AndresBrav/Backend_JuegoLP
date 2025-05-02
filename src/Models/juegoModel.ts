import { DataTypes, Model, Sequelize } from 'sequelize';
import db from '../db/conexion'; // Asegúrate de que esta ruta sea correcta
import UsuarioJuegos from './usuario_juegosModel';

// Define el modelo con los tipos específicos
const Juego = db.define('Juego', {
  nombre_juego: {
    type: DataTypes.STRING,
    allowNull: false,
  }
},{
    tableName:'juegos'
});

Juego.hasMany(UsuarioJuegos,{
    foreignKey:'juego_id',
    sourceKey:'id'
})

UsuarioJuegos.belongsTo(Juego, {
    foreignKey: 'juego_id',
    targetKey: 'id'
  });


export default Juego;