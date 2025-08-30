// Download the specific metaframe library version
const url = new URL(window.location.href);
var version = url.pathname.split('/').filter(e => e !== '')[3] || "latest"; 
const importURl = `${version === "latest" ? "/lib/index.js" : "https://cdn.jsdelivr.net/npm/@metapages/metapage@" + version.split("-")[0]}`;
const { Metaframe, Metapage } = await import(importURl);

const debug = ["debug", "mp_debug"].reduce((exists, flag) => {
    return exists || url.searchParams.get(flag) === "true" || url.searchParams.get(flag) === "1"
}, false);
if (debug) {
    console.log("❗🏗️ FRAME debug");
}

const messagePassingMetapageDefinition = {
    "meta": {
      "layouts": {
        "react-grid-layout": {
          "docs": "https://www.npmjs.com/package/react-grid-layout",
          "props": {
            "cols": 12,
            "margin": [20, 40],
            "rowHeight": 100,
            "containerPadding": [5, 5]
          },
          "layout": [
            {
              "h": 2,
              "i": "metapage1",
              "w": 6,
              "x": 0,
              "y": 0
            },
            {
              "h": 2,
              "i": "metapage2", 
              "w": 6,
              "x": 6,
              "y": 0
            }
          ]
        }
      }
    },
    "version": "2",
    "metaframes": {
      "frame1": {
        "url": "https://js.mtfm.io/#?js=JTJGJTJGJTIwQ29udGludW91cyUyMG1lc3NhZ2UlMjBzZW5kZXIlMEFsZXQlMjBjb3VudGVyJTIwJTNEJTIwMCUzQiUwQWxldCUyMG1lc3NhZ2VzJTIwJTNEJTIwJTVCJTVEJTNCJTBBJTBBJTJGJTJGJTIwRnVuY3Rpb24lMjB0byUyMHVwZGF0ZSUyMHRoZSUyMGRpc3BsYXklMEFjb25zdCUyMHVwZGF0ZURpc3BsYXklMjAlM0QlMjAoKSUyMCUzRCUzRSUyMCU3QiUwQSUyMCUyMHJvb3QuaW5uZXJIVE1MJTIwJTNEJTIwJTYwQ29udGludW91cyUyME1lc3NhZ2UlMjBTZW5kZXIlMjAoJTI0JTdCbWV0YWZyYW1lLmlkJTdEKSUyMCUzQSUyMCUyNCU3QmNvdW50ZXIlN0QlMjAoJTI0JTdCRGF0ZS5ub3coKSU3RCklNjAlM0IlMEElN0QlM0IlMEElMEElMEElMkYlMkYlMjBGdW5jdGlvbiUyMHRvJTIwc2VuZCUyMGElMjBtZXNzYWdlJTBBY29uc3QlMjBzZW5kTWVzc2FnZSUyMCUzRCUyMCgpJTIwJTNEJTNFJTIwJTdCJTBBJTIwJTIwY291bnRlciUyQiUyQiUzQiUwQSUyMCUyMGNvbnN0JTIwbWVzc2FnZSUyMCUzRCUyMCU2ME1lc3NhZ2UlMjAlMjMlMjQlN0Jjb3VudGVyJTdEJTIwZnJvbSUyMCUyNCU3Qm1ldGFmcmFtZS5pZCU3RCUyMCUyNCU3QkRhdGUubm93KCklN0QlNjAlM0IlMEElMjAlMjAlMEElMjAlMjAlMkYlMkYlMjBTZW5kJTIwdGhlJTIwbWVzc2FnZSUyMGFzJTIwYW4lMjBvdXRwdXQlMEElMjAlMjBzZXRPdXRwdXQoJ21lc3NhZ2UnJTJDJTIwbWVzc2FnZSklM0IlMEElMjAlMjAlMEElMjAlMjAlMkYlMkYlMjBVcGRhdGUlMjB0aGUlMjBkaXNwbGF5JTBBJTIwJTIwdXBkYXRlRGlzcGxheSgpJTNCJTBBJTdEJTBBJTIwJTIwJTBBJTIwJTIwJTJGJTJGJTIwSGFuZGxlJTIwaW5jb21pbmclMjBtZXNzYWdlcyUwQWV4cG9ydCUyMGNvbnN0JTIwb25JbnB1dHMlMjAlM0QlMjAoaW5wdXRzKSUyMCUzRCUzRSUyMCU3QiUwQSUyMCUyMCUyRiUyRiUyMENoZWNrJTIwaWYlMjB3ZSUyMHJlY2VpdmVkJTIwYSUyMG1lc3NhZ2UlMjBpbnB1dCUwQSUyMCUyMGlmJTIwKGlucHV0cy5tZXNzYWdlJTIwJTI2JTI2JTIwbWVzc2FnZXMubGVuZ3RoJTIwJTNDJTIwMTAwKSUyMCU3QiUwQSUyMCUyMCUyMCUyMG1lc3NhZ2VzLnB1c2goaW5wdXRzLm1lc3NhZ2UpJTNCJTBBJTIwJTIwJTIwJTIwdXBkYXRlRGlzcGxheSgpJTNCJTBBJTIwJTIwJTIwJTIwbG9nKCU2MFJlY2VpdmVkJTNBJTIwJTI0JTdCaW5wdXRzLm1lc3NhZ2UlN0QlNjApJTNCJTBBJTIwJTIwJTdEJTBBJTdEJTNCJTBBJTBBJTJGJTJGJTIwSW5pdGlhbGl6ZSUyMHRoZSUyMGRpc3BsYXklMEF1cGRhdGVEaXNwbGF5KCklM0IlMEElMEElMkYlMkYlMjBTZXQlMjB1cCUyMHRoZSUyMGludGVydmFsJTIwdG8lMjBzZW5kJTIwbWVzc2FnZXMlMEFjb25zdCUyMGludGVydmFsJTIwJTNEJTIwc2V0SW50ZXJ2YWwoc2VuZE1lc3NhZ2UlMkMlMjAxMDAwKSUzQiUwQSUwQWV4cG9ydCUyMGNvbnN0JTIwY2xlYW51cCUyMCUzRCUyMCgpJTIwJTNEJTNFJTIwJTdCJTBBJTIwJTIwJTIwJTIwY2xlYXJJbnRlcnZhbChpbnRlcnZhbCklM0IlMEElN0QlMEElMEE=",
        "inputs": [
          {
            "source": "",
            "metaframe": "frame2"
          }
        ]
      },
      "frame2": {
        "url": "https://js.mtfm.io/#?js=JTJGJTJGJTIwQ29udGludW91cyUyMG1lc3NhZ2UlMjBzZW5kZXIlMEFsZXQlMjBjb3VudGVyJTIwJTNEJTIwMCUzQiUwQWxldCUyMG1lc3NhZ2VzJTIwJTNEJTIwJTVCJTVEJTNCJTBBJTBBJTJGJTJGJTIwRnVuY3Rpb24lMjB0byUyMHVwZGF0ZSUyMHRoZSUyMGRpc3BsYXklMEFjb25zdCUyMHVwZGF0ZURpc3BsYXklMjAlM0QlMjAoKSUyMCUzRCUzRSUyMCU3QiUwQSUyMCUyMHJvb3QuaW5uZXJIVE1MJTIwJTNEJTIwJTYwQ29udGludW91cyUyME1lc3NhZ2UlMjBTZW5kZXIlMjAoJTI0JTdCbWV0YWZyYW1lLmlkJTdEKSUyMCUzQSUyMCUyNCU3QmNvdW50ZXIlN0QlMjAoJTI0JTdCRGF0ZS5ub3coKSU3RCklNjAlM0IlMEElN0QlM0IlMEElMEElMEElMkYlMkYlMjBGdW5jdGlvbiUyMHRvJTIwc2VuZCUyMGElMjBtZXNzYWdlJTBBY29uc3QlMjBzZW5kTWVzc2FnZSUyMCUzRCUyMCgpJTIwJTNEJTNFJTIwJTdCJTBBJTIwJTIwY291bnRlciUyQiUyQiUzQiUwQSUyMCUyMGNvbnN0JTIwbWVzc2FnZSUyMCUzRCUyMCU2ME1lc3NhZ2UlMjAlMjMlMjQlN0Jjb3VudGVyJTdEJTIwZnJvbSUyMCUyNCU3Qm1ldGFmcmFtZS5pZCU3RCUyMCUyNCU3QkRhdGUubm93KCklN0QlNjAlM0IlMEElMjAlMjAlMEElMjAlMjAlMkYlMkYlMjBTZW5kJTIwdGhlJTIwbWVzc2FnZSUyMGFzJTIwYW4lMjBvdXRwdXQlMEElMjAlMjBzZXRPdXRwdXQoJ21lc3NhZ2UnJTJDJTIwbWVzc2FnZSklM0IlMEElMjAlMjAlMEElMjAlMjAlMkYlMkYlMjBVcGRhdGUlMjB0aGUlMjBkaXNwbGF5JTBBJTIwJTIwdXBkYXRlRGlzcGxheSgpJTNCJTBBJTdEJTBBJTIwJTIwJTBBJTIwJTIwJTJGJTJGJTIwSGFuZGxlJTIwaW5jb21pbmclMjBtZXNzYWdlcyUwQWV4cG9ydCUyMGNvbnN0JTIwb25JbnB1dHMlMjAlM0QlMjAoaW5wdXRzKSUyMCUzRCUzRSUyMCU3QiUwQSUyMCUyMCUyRiUyRiUyMENoZWNrJTIwaWYlMjB3ZSUyMHJlY2VpdmVkJTIwYSUyMG1lc3NhZ2UlMjBpbnB1dCUwQSUyMCUyMGlmJTIwKGlucHV0cy5tZXNzYWdlJTIwJTI2JTI2JTIwbWVzc2FnZXMubGVuZ3RoJTIwJTNDJTIwMTAwKSUyMCU3QiUwQSUyMCUyMCUyMCUyMG1lc3NhZ2VzLnB1c2goaW5wdXRzLm1lc3NhZ2UpJTNCJTBBJTIwJTIwJTIwJTIwdXBkYXRlRGlzcGxheSgpJTNCJTBBJTIwJTIwJTIwJTIwbG9nKCU2MFJlY2VpdmVkJTNBJTIwJTI0JTdCaW5wdXRzLm1lc3NhZ2UlN0QlNjApJTNCJTBBJTIwJTIwJTdEJTBBJTdEJTNCJTBBJTBBJTJGJTJGJTIwSW5pdGlhbGl6ZSUyMHRoZSUyMGRpc3BsYXklMEF1cGRhdGVEaXNwbGF5KCklM0IlMEElMEElMkYlMkYlMjBTZXQlMjB1cCUyMHRoZSUyMGludGVydmFsJTIwdG8lMjBzZW5kJTIwbWVzc2FnZXMlMEFjb25zdCUyMGludGVydmFsJTIwJTNEJTIwc2V0SW50ZXJ2YWwoc2VuZE1lc3NhZ2UlMkMlMjAxMDAwKSUzQiUwQSUwQWV4cG9ydCUyMGNvbnN0JTIwY2xlYW51cCUyMCUzRCUyMCgpJTIwJTNEJTNFJTIwJTdCJTBBJTIwJTIwJTIwJTIwY2xlYXJJbnRlcnZhbChpbnRlcnZhbCklM0IlMEElN0QlMEElMEE=",
        "inputs": [
          {
            "source": "",
            "metaframe": "frame1"
          }
        ]
      }
    }
  }

const columnContainer = document.createElement("div");
columnContainer.style = "display: flex; flex-direction: column; width: 100%;";
document.getElementById("body").appendChild(columnContainer);


for (const count of [1, 2]) {
  const pageContainer = document.createElement("div");
  pageContainer.style = "display: flex; flex-direction: column; width: 100%;";
  const title1 = document.createElement("h3");
  title1.textContent = `Metapage ${count} concurrent`;
  pageContainer.appendChild(title1);
  columnContainer.appendChild(pageContainer);
  
  const row = document.createElement("div");
  row.style = "display: flex; flex-direction: row; gap: 10px; width: 500px; min-height: 300px;";
  pageContainer.appendChild(row);

  const metapageInstance = await Metapage.from(messagePassingMetapageDefinition);
  // await metapageInstance.init();

  // row.appendChild(column1);
  // document.getElementById("body").appendChild(row);
  
  for (const metaframeId of metapageInstance.getMetaframeIds()) {
      const iframe = await metapageInstance.getMetaframe(metaframeId).iframe;
      iframe.style = "width: 100%; height: 300px;";
      row.appendChild(iframe);
  }
}
