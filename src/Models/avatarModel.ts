import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

interface AvatarAttributes {
    id?: number;
    url?: string;
}

export interface AvatarInstance
    extends Model<AvatarAttributes>,
        AvatarAttributes {}

const Avatares = db.define<AvatarInstance>(
    "Avatares",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "avatares",
        timestamps: false, // IMPORTANT if you don't have createdAt/updatedAt
    }
);

export default Avatares;
