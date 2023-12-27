export type CleanupHandler = (callback: () => void) => void

export let onCleanup: CleanupHandler = () => {
    throw new Error("Cleanup handler not set. Call setCleanupHandler() first.")
}

export function setCleanupHandler(handler: CleanupHandler): void {
    onCleanup = handler
}
