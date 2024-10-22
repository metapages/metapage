import { type PageProps } from '$fresh/server.ts';

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Metapage core module API and Tests</title>

        {/* <link
          rel='stylesheet'
          href='https://cdn.simplecss.org/simple.min.css'
        ></link> */}

        <link rel="stylesheet" href="/mp/style.css"></link>
      </head>
      <body>
        <header class="box backgroundGrey600">
          <div style="display: flex; justify-content: flex-start; align-items: center;" class="backgroundGrey600">
            <a href="/">
              <img
                style="margin-top: 10px; margin-right: 16px;"
                class="my-6"
                src="/mp/logo.svg"
                width="38"
                height="38"
                alt="the Metapages logo"
              />
            </a>
            <div class="backgroundGrey600">
              <h1>Metapages core module API and Tests</h1>
            </div>
          </div>

          <nav class="box backgroundGrey600">
            <a class="linkpadding" href="/test/metapage">Tests</a>
            <a class="linkpadding" href="/convert">Convert</a>
            <a class="linkpadding" href="/versions">Versions</a>
          </nav>
        </header>
        <div class="box">
          <Component />
        </div>
      </body>
    </html>
  );
}
