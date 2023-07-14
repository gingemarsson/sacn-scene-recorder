export const listToMap = <S extends string | number, T>(list: S[], mapper: (s: S) => T) => {
    return list.reduce(
        (record: Record<S, T>, currentElement: S) => ({
            ...record,
            [currentElement]: mapper(currentElement),
        }),
        {} as Record<S, T>,
    );
};
