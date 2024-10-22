export default function Home() {
  
  return (
    <div class="px-4 py-8 mx-auto bg-[#fff]">
      <div class="max-w-screen-md mx-auto flex flex-col items-left justify-center">
        <h2>Description</h2>
        <br/>
        <p>This service supports the <a href="https://github.com/metapages/metapage">core metapage framework</a>:</p>
        <ul>
          <li><a href="/test/metapage">test the core modules</a></li>
          <li><a href="/convert">provide a durable version translation service</a></li>
          <li><a href="/versions/metapages/metapage">and other services, such as listing supported versions</a></li>
        </ul>
        <br/>
        <p>The source code for this service is available <a href="https://github.com/metapages/metapage">on GitHub</a>.</p>
      </div>
    </div>
  );
}
