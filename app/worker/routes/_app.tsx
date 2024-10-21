import { type PageProps } from '$fresh/server.ts'
export default function App ({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>worker</title>
        {/* <link rel="stylesheet" href="/styles.css" /> */}
        {/* <link rel="stylesheet" href="/mpg.css" /> */}
        {/* <link rel="stylesheet" href="/bulma-0.7.1.css" /> */}
        <link
          rel='stylesheet'
          href='https://cdn.simplecss.org/simple.min.css'
        ></link>
      </head>
      <body>
        <header>
            
            <div style='display: flex; justify-content: center; align-items: center;'>
          <a href='/'>
              <img
                style='margin-top: 10px; margin-right: 16px;'
                class='my-6'
                src='/logo.svg'
                width='38'
                height='38'
                alt='the Metapages logo'
              />
          </a>
              <div>
                <h1>Metapages core module API and Tests</h1>
              </div>
            </div>

          <nav>
            <a href='/'>Home</a>
            <a href='/test/metapage'>Tests</a>
            <a href='/convert'>Convert</a>
            <a href='/versions'>Versions</a>
          </nav>
          
        </header>
        <Component />
      </body>
    </html>
  )
}
