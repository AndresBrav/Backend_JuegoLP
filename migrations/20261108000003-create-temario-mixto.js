"use strict";

/** Crea el temario "Mixto" y reclasifica los pseudo sin temario previo. */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        // Insertar "Mixto" si no existe (orden 7, último de la lista)
        let idMixto = await queryInterface.rawSelect(
            "Temarios_IA",
            { where: { nombre: "Mixto" } },
            ["id"],
        );

        if (!idMixto) {
            await queryInterface.bulkInsert("Temarios_IA", [
                {
                    nombre: "Mixto",
                    orden: 7,
                    createdAt: now,
                    updatedAt: now,
                },
            ]);
            idMixto = await queryInterface.rawSelect(
                "Temarios_IA",
                { where: { nombre: "Mixto" } },
                ["id"],
            );
        }

        // Reclasificar ejercicios de pseudocódigo IA sin temario
        await queryInterface.sequelize.query(
            `UPDATE juegosia SET temario_id = :idMixto
             WHERE tipo_juego = 'iapseudo' AND temario_id IS NULL`,
            { replacements: { idMixto } },
        );
    },

    async down(queryInterface) {
        // Liberar los juegos que apunten a Mixto y borrar el temario
        const idMixto = await queryInterface.rawSelect(
            "Temarios_IA",
            { where: { nombre: "Mixto" } },
            ["id"],
        );

        if (idMixto) {
            await queryInterface.sequelize.query(
                `UPDATE juegosia SET temario_id = NULL WHERE temario_id = :idMixto`,
                { replacements: { idMixto } },
            );
            await queryInterface.bulkDelete("Temarios_IA", {
                nombre: "Mixto",
            });
        }
    },
};
