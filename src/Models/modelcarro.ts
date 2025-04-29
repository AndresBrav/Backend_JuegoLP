import { DataTypes, Model, Sequelize } from 'sequelize';
import db from '../db/conexion'; 

// define crea o usa
const Carro = db.define("Carro", {
    nombre: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.STRING
    },
    precio: {
        type: DataTypes.DOUBLE
    },
    stock: {
        type: DataTypes.INTEGER // Se recomienda usar INTEGER en lugar de NUMBER
    }
},
    {
        createdAt: false, // Para que no tenga la columna createdAt
        updatedAt: false // Para que no tenga la columna updatedAt
    });

export default Carro