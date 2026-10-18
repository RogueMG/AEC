// The site's one diagonal is 16° off vertical (--cut-angle in index.css).
// A slanted edge on something `heightPx` tall spans this many pixels across.
export const cutFor = (heightPx: number) => Math.round(heightPx * Math.tan((16 * Math.PI) / 180));
