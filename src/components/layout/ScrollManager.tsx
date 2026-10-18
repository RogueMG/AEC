import { useEffect } from "react";
import { useLocation } from "react-router";

// New page: start at the top. Link with a hash (/#contact): scroll to that section once it renders.
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let frame = 0;
    let tries = 0;
    const seek = () => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView();
      else if (tries++ < 60) frame = requestAnimationFrame(seek);
    };
    seek();
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

export default ScrollManager;
