// just a thin wrapper to do graphql stuff easier
export async function graphqlFetch<V, R>(url : string, query : string, variables? : V, operationName? : string, headers? : any): Promise<R> {
  const opts = {
    method: "POST",
    headers: Object.assign({
      "Content-Type": "application/json"
    }, headers),
    body: JSON.stringify({query, operationName, variables})
  };
  const response = await fetch(url, opts);
  return await response.json();
}

export class Graphql {
  url: string;
  headers?: any;

  constructor(url : string, headers : any) {
    this.url = url;
    this.headers = headers;
  }

  fetch<V, R>(query : string, variables? : V, operationName? : string): Promise<R> {
    return graphqlFetch(this.url, query, variables, operationName, this.headers);
  }
}

// export async = () => {


// let { PORT_GRAPHQL } = envArgs({PORT_GRAPHQL:'8080'});

// if (isInsideDocker()) {
//     PORT_GRAPHQL = "8080";
// }

// // assumes that your hasura service is called graphql
// const GRAPHQL_DOMAIN = isInsideDocker() ? 'graphql' : 'localhost';

// console.log(`PORT_GRAPHQL=${PORT_GRAPHQL}`);

// const url = `http://${GRAPHQL_DOMAIN}:${PORT_GRAPHQL}/healthz`;

// console.log(`Waiting on ${url}`);
// await waitOn200StatusFromUrl({url, interval:2000, requestTimeout:1000});
// console.log(`graphql ready!`);

// }
