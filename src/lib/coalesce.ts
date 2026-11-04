/**
 * Wraps an async task so that calls never overlap: if `run()` is called while a
 * run is in progress, exactly one more run happens after it finishes (reading
 * the latest state), no matter how many calls arrived in between.
 */
export function createCoalescingRunner(task: () => Promise<void>) {
  let running: Promise<void> | null = null;
  let pending = false;

  const loop = async () => {
    do {
      pending = false;
      try {
        await task();
      } catch (error) {
        console.warn('[coalescing-runner] task failed', error);
      }
    } while (pending);
  };

  return {
    run(): Promise<void> {
      if (running) {
        pending = true;
        return running;
      }
      running = loop().finally(() => {
        running = null;
      });
      return running;
    },
  };
}
