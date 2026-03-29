let loadingPromise: Promise<any> | null = null;

interface AmapWebSdkOptions {
  apiKey: string;
  securityJsCode?: string;
}

function getGlobalAmap(): any | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as any).AMap ?? null;
}

function applyAmapSecurityConfig(securityJsCode?: string): void {
  if (typeof window === "undefined" || !securityJsCode) {
    return;
  }

  (window as any)._AMapSecurityConfig = {
    ...(window as any)._AMapSecurityConfig,
    securityJsCode
  };
}

export function loadAmapWebSdk(options: AmapWebSdkOptions): Promise<any> {
  const { apiKey, securityJsCode } = options;
  applyAmapSecurityConfig(securityJsCode);

  const existing = getGlobalAmap();
  if (existing) {
    return Promise.resolve(existing);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("当前环境不支持加载高德 Web SDK"));
      return;
    }

    const scriptId = "amap-web-sdk";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        const amap = getGlobalAmap();
        if (amap) {
          resolve(amap);
        } else {
          reject(new Error("高德 SDK 已加载，但 AMap 对象不存在"));
        }
      });
      existingScript.addEventListener("error", () => reject(new Error("高德 SDK 脚本加载失败")));
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(apiKey)}`;
    script.async = true;

    script.onload = () => {
      const amap = getGlobalAmap();
      if (amap) {
        resolve(amap);
      } else {
        reject(new Error("高德 SDK 已加载，但 AMap 对象不存在"));
      }
    };

    script.onerror = () => {
      reject(new Error("高德 SDK 脚本加载失败"));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}
