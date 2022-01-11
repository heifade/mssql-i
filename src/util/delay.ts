/**
 * 延迟
 * @param millisecond 毫秒
 */
 export function delay(millisecond: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, millisecond);
  });
}
