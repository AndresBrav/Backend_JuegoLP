
export const isString = (id: any): boolean => {
    if (typeof id === 'string') {
        return true;
    } else {
        return false;
    }
};

export const isNumero = (x:any):boolean => {
    if (typeof x === 'number') {
        return true;
    } else {
        return false;
    }
}