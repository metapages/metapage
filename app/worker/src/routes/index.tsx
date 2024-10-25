export default function Home() {
  
  return (
    <div class="px-4 py-8 mx-auto bg-[#fff]">
      <div class="max-w-screen-md mx-auto flex flex-col items-left justify-center">
        <h2>Description</h2>
        <br/>
        <p>This service supports the <a href="https://github.com/metapages/metapage">core metapage framework</a>:</p>
        <ul>
          <li><a href="/test/metapage">test</a> the core modules</li>
          <li>provide a durable <a href="/convert">version translation service</a></li>
          <li>and other services, such as <a href="/versions/metapages/metapage">listing supported versions</a></li>
        </ul>
        <br/>
      </div>
    </div>
  );
}
