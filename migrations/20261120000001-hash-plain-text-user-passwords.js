"use strict";

const argon2 = require("argon2");

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            const [usuarios] = await queryInterface.sequelize.query(
                "SELECT id, password FROM Usuarios",
                { transaction },
            );

            for (const usuario of usuarios) {
                if (typeof usuario.password !== "string") {
                    throw new Error(
                        `La contraseña del usuario ${usuario.id} no es válida`,
                    );
                }

                if (/^\$argon2(?:id|i|d)\$/.test(usuario.password)) {
                    continue;
                }

                const password = await argon2.hash(usuario.password, {
                    type: argon2.argon2id,
                });

                await queryInterface.bulkUpdate(
                    "Usuarios",
                    { password },
                    { id: usuario.id },
                    { transaction },
                );
            }
        });
    },

    async down() {
        throw new Error(
            "No se pueden revertir los hashes de contraseñas; restaure un respaldo previo si es necesario.",
        );
    },
};
