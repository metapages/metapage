import { useSignal } from "@preact/signals";


export default function Home() {
  const count = useSignal(3);
  return (
    <div class="px-4 py-8 mx-auto bg-[#fff]">
      <div class="max-w-screen-md mx-auto flex flex-col items-left justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Metapages core module API and Tests</h1>
        <br/>
        <p>This service is used to test the Metapages core modules, display versions, provide a durable version translation service, and </p>
        <br/>
        <ul>
          <li><a href="/test/metapage">Test npm module: @metapages/metapage</a></li>
          <li><a href="/versions/metapages/metapage">Versions of @metapages/metapage</a></li>
          <li><a href="/convert">Convert definitions API</a></li>
        </ul>        
      </div>
    </div>
  );
}
