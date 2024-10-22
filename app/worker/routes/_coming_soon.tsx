import { Head } from '$fresh/runtime.ts';

export default function ComingSoon() {
  return (
    <>
      <Head>
        <title>Coming soon</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-[#86efac]">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/mp/logo.svg"
            width="28"
            height="28"
            alt="the Fresh logo: a sliced lemon dripping with juice"
          />
          <h1 class="text-4xl font-bold">Coming soon</h1>
          <p class="my-4">
            This is on the roadmap, but not yet implemented.
          </p>
          <a href="/" class="underline">Go back home</a>
        </div>
      </div>
    </>
  );
}
