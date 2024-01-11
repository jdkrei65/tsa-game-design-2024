
const modes = {};

export const manageModes = {
    exitAll: () => {
        for (const m in modes) {
            modes[m].exit();
        }
    },
    enterMode: (name) => {
        manageModes.exitAll();
        modes[name].enter();
    },
    addMode: (name, enterFunction, exitFunction) => {
        modes[name] = {
            enter: enterFunction,
            exit: exitFunction
        }
    }
}