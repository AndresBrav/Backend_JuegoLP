import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

// atributos
interface NotificacionesAttributes {
    id?: number;
    descripcion?: string;
    usuario_id?: number;
    leido?: boolean;
    fecha?: Date;
}

// instancia
export interface NotificacionesInstance
    extends Model<NotificacionesAttributes>, NotificacionesAttributes {}

const Notificaciones = db.define<NotificacionesInstance>(
    "Notificaciones",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        leido: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        fecha: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "notificaciones",
        timestamps: false, // 👈 desactivar el createdAt updatedAt
    },
);

export default Notificaciones;
