const useThrottle = <T extends unknown[]>(cb: (...args: T) => void, delay = 1000) => {

    let shouldWait = false
    let waitingArgs: T | null = null

    const timeoutFunc = () => {
        if (waitingArgs == null) {
            shouldWait = false
        } else {
            cb(...waitingArgs)
            waitingArgs = null
            setTimeout(timeoutFunc, delay);
        }
    }

    return (...args: T) => {

        if (shouldWait) {
            waitingArgs = args;
            return
        }

        cb(...args)
        shouldWait = true
        setTimeout(timeoutFunc, delay);
    }
}

export default useThrottle