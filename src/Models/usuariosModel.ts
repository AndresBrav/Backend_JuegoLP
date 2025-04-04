import db from '../db/conexion'
import {DataTypes} from 'sequelize'

// define crea o usa
const Usuarios = db.define("Usuarios", {
    username: {
        type: DataTypes.STRING
    },
    edad: {
        type: DataTypes.INTEGER
    },
}
);

export default Usuarios;
