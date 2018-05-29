export const wrapRejection = <T, D>(
    promise: Promise<T>,
    defaultValue: D
) => ((promise)
    .then(v => v)
    .catch(e => {
        console.error(e);
        return defaultValue;
    })
);


export const predicateRace = <T>(
    promises: Promise<T>[],
    predicate: ((v: T) => boolean),
    suppressRejections: boolean = true
): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        if (suppressRejections) {
            Promise.all(promises.map(promise => ((promise)
                .then(v => {
                    if (predicate(v)) {
                        resolved = true;
                        resolve(v);
                    }
                })
                .catch(e => {
                    console.log(e);
                })
            ))).then(() => {
                if (!resolved) reject('None of the promisee resolved successfully.');
            });
        } else {
            Promise.all(promises.map(promise => ((promise)
                .then(v => {
                    if (predicate(v)) {
                        resolved = true;
                        resolve(v);
                    }
                })
            ))).then(() => {
                if (!resolved) reject('None of the promisee resolved successfully.');
            });
        }
    })
);


export const rejectionRace = <T>(promises: Promise<T>[]): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        Promise.all(promises.map(promise => ((promise)
            .then(v => {
                resolved = true;
                resolve(v);
            })
            .catch(e => {
                console.log(e);
            })
        ))).then(() => {
            if (!resolved) reject('None of the promisee resolved successfully.');
        });
    })
);