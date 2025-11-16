import React, { useRef, useEffect } from "react";

const AdBanner = () => {
  const adContainerRef = useRef(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    if (adLoadedRef.current) {
      return;
    }

    const container = adContainerRef.current;
    if (container) {
      try {
        const configScript = document.createElement("script");
        configScript.type = "text/javascript";
        configScript.innerHTML = `
          window.atOptions = {
            'key' : '9aec1d7290de563d4016cdc8dd7dec41',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        `;

        const invokeScript = document.createElement("script");
        invokeScript.type = "text/javascript";
        invokeScript.src =
          "//www.highperformanceformat.com/9aec1d7290de563d4016cdc8dd7dec41/invoke.js";
        invokeScript.async = true;

        container.appendChild(configScript);
        container.appendChild(invokeScript);

        adLoadedRef.current = true;
      } catch (e) {
        console.error("Ad script injection failed:", e);
      }
    }
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-2 bg-yellow-900/20 z-40 flex justify-center items-center lg:hidden"
      style={{ height: "66px" }}
    >
      <div ref={adContainerRef} style={{ width: "320px", height: "50px" }}>
        {/* The ad script will inject the 320x50 iframe here */}
      </div>
    </div>
  );
};

export default AdBanner;