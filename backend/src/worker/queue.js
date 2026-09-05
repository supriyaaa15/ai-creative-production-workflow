// Small in-process concurrency-limited queue. At demo scale (3-5 assets x
// 2-3 variants = ~15 tasks) this is more reliable than standing up Redis/
// BullMQ, and the interface (enqueue) is narrow enough to swap for a real
// queue later without touching worker logic.
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 3);

let active = 0;
const pending = [];

function pump() {
  while (active < CONCURRENCY && pending.length) {
    const { task, resolve, reject } = pending.shift();
    active++;
    task()
      .then(resolve, reject)
      .finally(() => {
        active--;
        pump();
      });
  }
}

export function enqueue(task) {
  return new Promise((resolve, reject) => {
    pending.push({ task, resolve, reject });
    pump();
  });
}
