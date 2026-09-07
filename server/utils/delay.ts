import type { H3Event } from 'h3'
/** Resolves true if the HTTP response closes before provider work begins. */
export function providerDelay(event: H3Event, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = (aborted: boolean) => {
      clearTimeout(timer)
      event.node.res.removeListener('close', cancel)
      resolve(aborted)
    }
    const cancel = () => finish(true)
    const timer = setTimeout(() => finish(false), ms)
    event.node.res.once('close', cancel)
    if (event.node.res.destroyed) finish(true)
  })
}
