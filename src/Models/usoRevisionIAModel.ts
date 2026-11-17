import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

interface UsoRevisionIAAttributes {
    id?: number;
    usuario_id?: number;
    juego_ia_id?: number;
    fecha_local?: string;
    cantidad?: number;
}

interface UsoRevisionIAInstance
    extends Model<UsoRevisionIAAttributes>,
        UsoRevisionIAAttributes {}

const UsoRevisionIA = db.define<UsoRevisionIAInstance>(
    "UsoRevisionIA",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        juego_ia_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fecha_local: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "Uso_Revision_IA",
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ["usuario_id", "juego_ia_id", "fecha_local"],
                name: "uq_uso_revision_ia_usuario_juego_fecha",
            },
        ],
    },
);

export default UsoRevisionIA;
