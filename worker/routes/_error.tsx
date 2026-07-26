import { HttpError } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

// Fresh 2 merges _404.tsx and _500.tsx into a single error page. A missing
// route arrives here as an HttpError with status 404; anything else is an
// unexpected server error.
export default define.page(function ErrorPage(ctx) {
  const isNotFound = ctx.error instanceof HttpError && ctx.error.status === 404;

  const title = isNotFound ? "404 - Page not found" : "Something went wrong";
  const message = isNotFound
    ? "The page you were looking for doesn't exist."
    : "An unexpected error occurred. Please try again.";

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div>
        <img
          src="/mp/logo.svg"
          width="28"
          height="28"
          alt="the Metapages logo"
        />
        <h1>{title}</h1>
        <p>{message}</p>
        <a href="/">Go back home</a>
      </div>
    </>
  );
});
