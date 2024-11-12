export default {} as typeof Worker & { new (): Worker };

self.onmessage = (event) => {
  const { data } = event;
  const result = data.numbers.reduce((acc: number, val: number) => acc + val, 0);
  self.postMessage({ result });
};