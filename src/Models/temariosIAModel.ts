import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

export interface TemarioIAAttributes {
    id?: number;
    nombre?: string;
    orden?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TemarioIAInstance
    extends Model<TemarioIAAttributes>,
        TemarioIAAttributes {}

// Temarios globales para los ejercicios de pseudocódigo generados
// con IA (clasificación pedagógica: Variables, Condicionales, etc.)
const TemariosIA = db.define<TemarioIAInstance>("TemariosIA", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
            len: { args: [2, 80], msg: "El nombre debe tener 2 a 80 caracteres" },
        },
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: "Temarios_IA",
    timestamps: true,
});

export default TemariosIA;
