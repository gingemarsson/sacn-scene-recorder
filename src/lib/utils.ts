export interface HasSortIndex {
    sortIndex: number;
};

export const sortIndexSortFn = (a: HasSortIndex, b: HasSortIndex) => {
    if ((a.sortIndex ?? 0) < (b.sortIndex ?? 0)) {
        return -1;
    }
    if ((a.sortIndex ?? 0) > (b.sortIndex ?? 0)) {
        return 1;
    }

    return 0;
};