export const isLikelyBrowserPageLoad = (headers: Headers): boolean => {
  // Check the Accept header
  const accept = headers.get("accept");
  if (accept && accept.includes("text/html")) {
    return true;
  }

  // Check the Sec-Fetch-Dest header
  const secFetchDest = headers.get("sec-fetch-dest");
  if (secFetchDest === "document") {
    return true;
  }

  // Check the Sec-Fetch-Mode header
  const secFetchMode = headers.get("sec-fetch-mode");
  if (secFetchMode === "navigate") {
    return true;
  }

  // Check if it's not an XMLHttpRequest
  const requestedWith = headers.get("x-requested-with");
  if (requestedWith !== "XMLHttpRequest") {
    return true;
  }

  // If none of the above conditions are met, it's likely not a browser page load
  return false;
}