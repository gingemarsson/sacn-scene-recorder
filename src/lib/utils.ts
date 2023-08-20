export interface HasSortIndex {
    sortIndex: number;
}

export const sortIndexSortFn = (a: HasSortIndex, b: HasSortIndex) => {
    if ((a.sortIndex ?? 0) < (b.sortIndex ?? 0)) {
        return -1;
    }
    if ((a.sortIndex ?? 0) > (b.sortIndex ?? 0)) {
        return 1;
    }

    return 0;
};

export const shuffleArray = <T>(array: T[], seed: number) => {
    const arrayCopy = [...array];

    for (var i = 0; i < arrayCopy.length; i++) {
        const randomIndex = ((seed % (i + 1)) + i) % arrayCopy.length;
        const temp = arrayCopy[i];
        arrayCopy[i] = arrayCopy[randomIndex];
        arrayCopy[randomIndex] = temp;
    }
    return arrayCopy;
};
