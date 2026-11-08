"use strict";

/** Temarios globales del temario de PSeInt para ejercicios IA de pseudocódigo. */
const TEMARIOS_IA = [
    { nombre: "Variables", orden: 1 },
    { nombre: "Condicionales", orden: 2 },
    { nombre: "Decisiones Anidada", orden: 3 },
    { nombre: "Repetitivas", orden: 4 },
    { nombre: "Funciones y SubProcesos", orden: 5 },
    { nombre: "Arreglos", orden: 6 },
    { nombre: "Mixto", orden: 7 },
];

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const registros = TEMARIOS_IA.map((t) => ({
            nombre: t.nombre,
            orden: t.orden,
            createdAt: now,
            updatedAt: now,
        }));

        for (const registro of registros) {
            const existentes = await queryInterface.rawSelect(
                "Temarios_IA",
                { where: { nombre: registro.nombre } },
                ["id"],
            );
            if (!existentes) {
                await queryInterface.bulkInsert("Temarios_IA", [registro]);
            }
        }
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("Temarios_IA", {
            nombre: TEMARIOS_IA.map((t) => t.nombre),
        });
    },
};
