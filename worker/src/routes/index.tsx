export default function Home() {
  return (
    <div class="px-4 py-8 mx-auto bg-[#fff]">
      <div class="max-w-screen-xl mx-auto flex flex-col items-left justify-center">
        <h2>Metapage Demo</h2>
        <br />
        <p>
          This service supports the{" "}
          <a href="https://docs.metapage.io">core metapage framework</a>:
        </p>
        <ul>
          <li>
            <a href="/m">render</a> any metapage JSON or URL
          </li>
          <li>
            <a href="/test/metapage">test</a> the core modules
          </li>
          <li>
            provide a durable <a href="/convert">version translation service</a>
          </li>
          <li>
            and other services, such as{" "}
            <a href="/versions/metapages/metapage">
              listing supported versions
            </a>
          </li>
        </ul>
        <br />
      </div>
    </div>
  );
}

const ExampleMetapage = {
  meta: {
    name: "Python interactive plotting",
    layouts: {
      "react-grid-layout": {
        docs: "https://www.npmjs.com/package/react-grid-layout",
        props: {
          cols: 12,
          margin: [20, 40],
          rowHeight: 100,
          containerPadding: [5, 5],
        },
        layout: [
          {
            h: 4,
            i: "run code",
            w: 6,
            x: 6,
            y: 0,
          },
          {
            h: 4,
            i: "visualize and interact",
            w: 6,
            x: 0,
            y: 0,
          },
        ],
      },
    },
    description: "Generate interactive plots with python\n\n",
  },
  version: "2",
  metaframes: {
    "run code": {
      url: "https://container.mtfm.io/#?definition=JTdCJTIyaW5wdXRzJTIyJTNBJTdCJTIyZGF0YS5jc3YlMjIlM0ElN0IlN0QlN0QlMkMlMjJvdXRwdXRzJTIyJTNBJTdCJTIycGxvdDEuanNvbiUyMiUzQSU3QiU3RCUyQyUyMnBsb3QyLmpzb24lMjIlM0ElN0IlN0QlN0QlN0Q%3D&hideLabels=false&inputs=JTdCJTIyc2NyaXB0LnB5JTIyJTNBJTIyaW1wb3J0JTIwcGxvdGx5LmdyYXBoX29iamVjdHMlMjBhcyUyMGdvJTVDbmltcG9ydCUyMHBsb3RseS5zdWJwbG90cyUyMGFzJTIwc3AlNUNuaW1wb3J0JTIwbnVtcHklMjBhcyUyMG5wJTVDbmZyb20lMjBwbG90bHkudXRpbHMlMjBpbXBvcnQlMjBQbG90bHlKU09ORW5jb2RlciU1Q25pbXBvcnQlMjBqc29uJTVDbiU1Q24lNUNuJTVDbiUyMyUyMEZpeGluZyUyMHJhbmRvbSUyMHN0YXRlJTIwZm9yJTIwcmVwcm9kdWNpYmlsaXR5JTVDbm5wLnJhbmRvbS5zZWVkKDE5NjgwODAxKSU1Q24lNUNuZHQlMjAlM0QlMjAwLjAxJTVDbnQlMjAlM0QlMjBucC5hcmFuZ2UoMCUyQyUyMDEwJTJDJTIwZHQpJTVDbm5zZTElMjAlM0QlMjBucC5yYW5kb20ucmFuZG4obGVuKHQpKSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMyUyMHdoaXRlJTIwbm9pc2UlMjAxJTVDbm5zZTIlMjAlM0QlMjBucC5yYW5kb20ucmFuZG4obGVuKHQpKSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMyUyMHdoaXRlJTIwbm9pc2UlMjAyJTVDbiU1Q24lMjMlMjBUd28lMjBzaWduYWxzJTIwd2l0aCUyMGElMjBjb2hlcmVudCUyMHBhcnQlMjBhdCUyMDEwJTIwSHolMjBhbmQlMjBhJTIwcmFuZG9tJTIwcGFydCU1Q25zMSUyMCUzRCUyMG5wLnNpbigyJTIwKiUyMG5wLnBpJTIwKiUyMDEwJTIwKiUyMHQpJTIwJTJCJTIwbnNlMSU1Q25zMiUyMCUzRCUyMG5wLnNpbigyJTIwKiUyMG5wLnBpJTIwKiUyMDEwJTIwKiUyMHQpJTIwJTJCJTIwbnNlMiU1Q24lNUNuJTIzJTIwQ3JlYXRlJTIwZmlndXJlJTIwd2l0aCUyMHNlY29uZGFyeSUyMHktYXhpcyU1Q25maWclMjAlM0QlMjBzcC5tYWtlX3N1YnBsb3RzKHJvd3MlM0QyJTJDJTIwY29scyUzRDElMkMlMjB2ZXJ0aWNhbF9zcGFjaW5nJTNEMC4yKSU1Q24lNUNuJTIzJTIwQWRkJTIwdHJhY2VzJTVDbmZpZy5hZGRfdHJhY2UoJTVDbiUyMCUyMCUyMCUyMGdvLlNjYXR0ZXIoeCUzRHQlMkMlMjB5JTNEczElMkMlMjBuYW1lJTNEJTVDJTIyczElNUMlMjIpJTJDJTVDbiUyMCUyMCUyMCUyMHJvdyUzRDElMkMlMjBjb2wlM0QxJTVDbiklNUNuJTVDbmZpZy5hZGRfdHJhY2UoJTVDbiUyMCUyMCUyMCUyMGdvLlNjYXR0ZXIoeCUzRHQlMkMlMjB5JTNEczIlMkMlMjBuYW1lJTNEJTVDJTIyczIlNUMlMjIpJTJDJTVDbiUyMCUyMCUyMCUyMHJvdyUzRDElMkMlMjBjb2wlM0QxJTVDbiklNUNuJTVDbiUyMyUyMENhbGN1bGF0ZSUyMGNvaGVyZW5jZSUyMChzaW1wbGlmaWVkJTIwdmVyc2lvbiklNUNuZnJlcSUyMCUzRCUyMG5wLmZmdC5mZnRmcmVxKGxlbih0KSUyQyUyMGR0KSU1Q25TMSUyMCUzRCUyMG5wLmZmdC5mZnQoczEpJTVDblMyJTIwJTNEJTIwbnAuZmZ0LmZmdChzMiklNUNuY29oZXJlbmNlJTIwJTNEJTIwbnAuYWJzKFMxJTIwKiUyMG5wLmNvbmooUzIpKSUyMCUyRiUyMChucC5hYnMoUzEpJTIwKiUyMG5wLmFicyhTMikpJTVDbiU1Q24lMjMlMjBBZGQlMjBjb2hlcmVuY2UlMjBwbG90JTVDbmZpZy5hZGRfdHJhY2UoJTVDbiUyMCUyMCUyMCUyMGdvLlNjYXR0ZXIoeCUzRGZyZXElNUIlM0FsZW4oZnJlcSklMkYlMkYyJTVEJTJDJTIweSUzRGNvaGVyZW5jZSU1QiUzQWxlbihmcmVxKSUyRiUyRjIlNUQlMkMlMjBuYW1lJTNEJTVDJTIyQ29oZXJlbmNlJTVDJTIyKSUyQyU1Q24lMjAlMjAlMjAlMjByb3clM0QyJTJDJTIwY29sJTNEMSU1Q24pJTVDbiU1Q24lMjMlMjBVcGRhdGUlMjB4YXhpcyUyMHByb3BlcnRpZXMlNUNuZmlnLnVwZGF0ZV94YXhlcyh0aXRsZV90ZXh0JTNEJTVDJTIyVGltZSUyMChzKSU1QyUyMiUyQyUyMHJvdyUzRDElMkMlMjBjb2wlM0QxKSU1Q25maWcudXBkYXRlX3hheGVzKHRpdGxlX3RleHQlM0QlNUMlMjJGcmVxdWVuY3klMjAoSHopJTVDJTIyJTJDJTIwcm93JTNEMiUyQyUyMGNvbCUzRDEpJTVDbiU1Q24lMjMlMjBVcGRhdGUlMjB5YXhpcyUyMHByb3BlcnRpZXMlNUNuZmlnLnVwZGF0ZV95YXhlcyh0aXRsZV90ZXh0JTNEJTVDJTIyczElMjBhbmQlMjBzMiU1QyUyMiUyQyUyMHJvdyUzRDElMkMlMjBjb2wlM0QxKSU1Q25maWcudXBkYXRlX3lheGVzKHRpdGxlX3RleHQlM0QlNUMlMjJDb2hlcmVuY2UlNUMlMjIlMkMlMjByb3clM0QyJTJDJTIwY29sJTNEMSUyQyUyMHRpY2tmb3JtYXQlM0QlNUMlMjIuMmYlNUMlMjIpJTVDbiU1Q24lMjMlMjBVcGRhdGUlMjBsYXlvdXQlNUNuZmlnLnVwZGF0ZV9sYXlvdXQoJTVDbiUyMCUyMCUyMCUyMHRpdGxlJTNEJTVDJTIyU2lnbmFsJTIwQW5hbHlzaXMlNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwc2hvd2xlZ2VuZCUzRFRydWUlMkMlNUNuJTIwJTIwJTIwJTIwYXV0b3NpemUlM0RUcnVlJTJDJTVDbiklNUNuJTVDbiUyMyUyMFNhdmUlMjBhcyUyMEpTT04lNUNud2l0aCUyMG9wZW4oJyUyRm91dHB1dHMlMkZwbG90Lmpzb24nJTJDJTIwJ3cnKSUyMGFzJTIwZiUzQSU1Q24lMjAlMjAlMjAlMjBqc29uLmR1bXAoZmlnLnRvX2RpY3QoKSUyQyUyMGYpJTVDbiUyMiU3RA%3D%3D&inputsmode=utf8&job=JTdCJTIyYnVpbGQlMjIlM0ElN0IlMjJkb2NrZXJmaWxlJTIyJTNBJTIyRlJPTSUyMHB5dGhvbiUzQTMuMTEtc2xpbSU1Q25SVU4lMjBwaXAlMjBpbnN0YWxsJTIwcGxvdGx5JTIwcGFuZGFzJTIwbnVtcHklMjIlN0QlMkMlMjJjb21tYW5kJTIyJTNBJTIycHl0aG9uJTIwJTJGaW5wdXRzJTJGc2NyaXB0LnB5JTIyJTJDJTIyaW1hZ2UlMjIlM0ElMjJweXRob24lM0EzLjExLXNsaW0lMjIlN0Q%3D&minimal=false&queue=public1&showOptions=true&tab=5",
      inputs: [],
    },
    "visualize and interact": {
      url: "https://metapage.io/mf/yrgfo0ncjb#?filesystem=false&frame=visualize%2Band%2Binteract&hideBorders=false&hideLabels=false&hideOptions=false&mermaid=false&minimal=false&showOptions=true",
      inputs: [
        {
          source: "plot.json",
          target: "plotly.json",
          metaframe: "run code",
        },
      ],
    },
  },
};
