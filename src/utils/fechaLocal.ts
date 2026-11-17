export const obtenerFechaLocalBolivia = (): string => {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/La_Paz",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const obtenerParte = (tipo: string) =>
        partes.find((parte) => parte.type === tipo)?.value ?? "";

    return `${obtenerParte("year")}-${obtenerParte("month")}-${obtenerParte("day")}`;
};
