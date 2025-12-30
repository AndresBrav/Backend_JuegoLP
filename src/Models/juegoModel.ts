import { DataTypes, Model, Sequelize } from "sequelize";
import db from "../db/conexion"; // Asegúrate de que esta ruta sea correcta
import UsuarioJuegos from "./usuario_juegosModel";

// Define el modelo con los tipos específicos
const Juegos = db.define(
    "Juegos",
    {
        nombre_juego: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nivel_juego: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "Juegos",
        timestamps: false, // 👈 Muy importante sin createdAt updateAt
    }
);

Juegos.hasMany(UsuarioJuegos, {
    foreignKey: "juego_id",
    sourceKey: "id",
});

UsuarioJuegos.belongsTo(Juegos, {
    foreignKey: "juego_id",
    targetKey: "id",
});

export default Juegos;
